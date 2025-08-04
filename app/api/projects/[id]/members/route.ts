import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// Helper function untuk otorisasi: Memastikan user adalah member/owner
async function authorizeProjectAccess(request: NextRequest, projectId: string) {
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

    return project ? { userId, isOwner: project.ownerId === userId } : null;
}

// Fungsi untuk melihat semua member dalam project
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id;
        const authInfo = await authorizeProjectAccess(request, projectId);

        // Hanya owner dan member yang bisa melihat daftar member
        if (!authInfo) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const memberships = await prisma.membership.findMany({
            where: {
                projectId: projectId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    }
                }
            }
        });

        return NextResponse.json(memberships);

    } catch (error) {
        console.error('[MEMBERS_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}


// Fungsi untuk menambahkan member baru ke project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const authInfo = await authorizeProjectAccess(request, projectId);

    // Hanya owner yang boleh menambah member
    if (!authInfo || !authInfo.isOwner) {
      return new NextResponse('Forbidden: Only the project owner can add members.', { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const userToAdd = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToAdd) {
        return new NextResponse('User to add not found', { status: 404 });
    }

    const existingMembership = await prisma.membership.findFirst({
      where: { userId: userId, projectId: projectId },
    });

    if (existingMembership) {
      return new NextResponse('User is already a member of this project', { status: 409 });
    }

    const newMembership = await prisma.membership.create({
      data: {
        userId: userId,
        projectId: projectId,
      },
      include: {
        user: {
            select: { id: true, email: true }
        }
      }
    });

    return NextResponse.json(newMembership, { status: 201 });

  } catch (error) {
    console.error('[MEMBERS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
