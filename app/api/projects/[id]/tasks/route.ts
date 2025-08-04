import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// Helper function untuk otorisasi (mirip dengan di atas, tapi bisa disederhanakan)
async function authorizeProjectAccess(request: NextRequest, projectId: string) {
    const userPayload = request.headers.get('x-user-payload');
    if (!userPayload) return null;
    const user = JSON.parse(userPayload);
    const userId = user.userId;

    const membership = await prisma.membership.findFirst({
        where: {
            projectId: projectId,
            userId: userId,
        }
    });

    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project) return null;

    const isOwner = project.ownerId === userId;

    if (isOwner || membership) {
        return { userId };
    }

    return null;
}

// Fungsi untuk mendapatkan semua task dalam sebuah project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const authInfo = await authorizeProjectAccess(request, projectId);

    // User harus menjadi owner atau member untuk melihat task
    if (!authInfo) {
      return new NextResponse('Forbidden: You must be a member of this project to view tasks.', { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: projectId,
      },
      include: { // Sertakan informasi user yang di-assign
        assignee: {
          select: {
            id: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc',
      }
    });

    return NextResponse.json(tasks);

  } catch (error) {
    console.error('[TASKS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


// Fungsi untuk membuat task baru dalam sebuah project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const authInfo = await authorizeProjectAccess(request, projectId);

    // User harus menjadi owner atau member untuk membuat task
    if (!authInfo) {
      return new NextResponse('Forbidden: You must be a member of this project to create tasks.', { status: 403 });
    }

    const body = await request.json();
    const { title, description, status, assigneeId } = body;

    if (!title || !status) {
      return new NextResponse('Title and status are required', { status: 400 });
    }

    // Validasi status
    const validStatuses = ['todo', 'in-progress', 'done'];
    if (!validStatuses.includes(status)) {
        return new NextResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, { status: 400 });
    }

    // (Opsional) Validasi apakah assigneeId adalah member project
    if (assigneeId) {
        const assigneeIsMember = await prisma.membership.findFirst({
            where: { userId: assigneeId, projectId: projectId }
        });
        const projectOwner = await prisma.project.findUnique({ where: { id: projectId } });
        if (!assigneeIsMember && projectOwner?.ownerId !== assigneeId) {
            return new NextResponse('Assignee must be a member or the owner of the project', { status: 400 });
        }
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        projectId,
        assigneeId, // bisa null jika tidak di-assign
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('[TASKS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
