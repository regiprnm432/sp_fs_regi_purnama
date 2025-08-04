import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// Helper otorisasi: Memastikan user adalah member/owner dari project tempat task ini berada
async function authorizeTaskAccess(request: NextRequest, projectId: string) {
    const userPayload = request.headers.get('x-user-payload');
    if (!userPayload) return null;
    const user = JSON.parse(userPayload);
    const userId = user.userId;

    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            OR: [
                { ownerId: userId },
                { memberships: { some: { userId } } }
            ]
        }
    });

    return project ? { userId } : null;
}

// Fungsi untuk mengupdate task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = params;
    const authInfo = await authorizeTaskAccess(request, projectId);

    if (!authInfo) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId }});
    if (!task || task.projectId !== projectId) {
        return new NextResponse("Task not found in this project", { status: 404 });
    }

    const body = await request.json();
    // Ambil field yang bisa diupdate dari body
    const { title, description, status, assigneeId } = body;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status,
        assigneeId,
      },
    });

    return NextResponse.json(updatedTask);

  } catch (error) {
    console.error('[TASK_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Fungsi untuk menghapus task
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; taskId: string } }
) {
    try {
        const { id: projectId, taskId } = params;
        const authInfo = await authorizeTaskAccess(request, projectId);
    
        if (!authInfo) {
          return new NextResponse("Forbidden", { status: 403 });
        }
    
        const task = await prisma.task.findUnique({ where: { id: taskId }});
        if (!task || task.projectId !== projectId) {
            return new NextResponse("Task not found in this project", { status: 404 });
        }

        await prisma.task.delete({
            where: { id: taskId }
        });

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error) {
        console.error('[TASK_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
