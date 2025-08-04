import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// Helper function untuk otorisasi
async function authorizeUser(request: NextRequest, projectId: string) {
  const userPayload = request.headers.get('x-user-payload');
  if (!userPayload) return null;
  const user = JSON.parse(userPayload);
  const userId = user.userId;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { memberships: true },
  });

  if (!project) return { error: 'Project not found', status: 404 };

  const isOwner = project.ownerId === userId;
  const isMember = project.memberships.some((m) => m.userId === userId);

  if (!isOwner && !isMember) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user, userId, isOwner, isMember, project };
}

// Fungsi untuk mendapatkan detail satu project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authorizeUser(request, params.id);
    if (!authResult || authResult.error) {
      return new NextResponse(authResult?.error || 'Unauthorized', { status: authResult?.status || 401 });
    }

    // Kembalikan data project jika user adalah owner atau member
    return NextResponse.json(authResult.project);

  } catch (error) {
    console.error('[PROJECT_GET_SINGLE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Fungsi untuk mengupdate project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authorizeUser(request, params.id);
    if (!authResult || authResult.error) {
      return new NextResponse(authResult?.error || 'Unauthorized', { status: authResult?.status || 401 });
    }

    // Hanya owner yang bisa mengupdate project
    if (!authResult.isOwner) {
      return new NextResponse('Forbidden: Only the project owner can update.', { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: { name },
    });

    return NextResponse.json(updatedProject);

  } catch (error) {
    console.error('[PROJECT_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Fungsi untuk menghapus project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authorizeUser(request, params.id);
    if (!authResult || authResult.error) {
      return new NextResponse(authResult?.error || 'Unauthorized', { status: authResult?.status || 401 });
    }

    // Hanya owner yang bisa menghapus project
    if (!authResult.isOwner) {
      return new NextResponse('Forbidden: Only the project owner can delete.', { status: 403 });
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content

  } catch (error) {
    console.error('[PROJECT_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
