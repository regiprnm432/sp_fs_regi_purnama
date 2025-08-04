import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// Fungsi untuk menghapus member dari project
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; memberId: string } }
) {
    try {
        const { id: projectId, memberId } = params;

        // Otorisasi: Hanya owner yang boleh menghapus member
        const userPayload = request.headers.get('x-user-payload');
        if (!userPayload) return new NextResponse('Unauthorized', { status: 401 });
        const currentUser = JSON.parse(userPayload);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return new NextResponse('Project not found', { status: 404 });
        }

        if (project.ownerId !== currentUser.userId) {
            return new NextResponse('Forbidden: Only the project owner can remove members.', { status: 403 });
        }

        // Cari membership berdasarkan ID-nya
        const membership = await prisma.membership.findUnique({
            where: { id: memberId }
        });

        if (!membership || membership.projectId !== projectId) {
            return new NextResponse('Membership not found in this project', { status: 404 });
        }

        // Hapus record membership
        await prisma.membership.delete({
            where: { id: memberId }
        });

        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error) {
        console.error('[MEMBER_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
