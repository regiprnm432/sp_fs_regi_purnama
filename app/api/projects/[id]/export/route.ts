import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// Helper otorisasi
async function authorizeProjectAccess(request: NextRequest, projectId: string) {
    const userPayload = request.headers.get('x-user-payload');
    if (!userPayload) return null;
    const user = JSON.parse(userPayload);
    const userId = user.userId;
    const project = await prisma.project.findFirst({
        where: { id: projectId, OR: [{ ownerId: userId }, { memberships: { some: { userId } } }] }
    });
    return project ? { userId } : null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id;
        const authInfo = await authorizeProjectAccess(request, projectId);

        if (!authInfo) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Ambil semua data project secara mendalam
        const projectData = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                owner: { select: { email: true } },
                memberships: { include: { user: { select: { email: true } } } },
                tasks: { include: { assignee: { select: { email: true } } } },
            }
        });

        if (!projectData) {
            return new NextResponse('Project not found', { status: 404 });
        }

        const jsonString = JSON.stringify(projectData, null, 2);
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        // Header ini akan memberitahu browser untuk mengunduh file
        headers.set('Content-Disposition', `attachment; filename="project_${projectId}.json"`);

        return new NextResponse(jsonString, { status: 200, headers });

    } catch (error) {
        console.error('[EXPORT_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
