import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// Helper otorisasi: Memastikan user adalah member/owner
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

        // Menghitung jumlah task berdasarkan status
        const taskCounts = await prisma.task.groupBy({
            by: ['status'],
            where: {
                projectId: projectId,
            },
            _count: {
                status: true,
            },
        });

        type TaskCount = { status: string; _count: { status: number } };

        // Format data agar mudah digunakan oleh library grafik
        const formattedData = [
            { name: 'To Do', count: taskCounts.find((t: TaskCount) => t.status === 'todo')?._count.status || 0 },
            { name: 'In Progress', count: taskCounts.find((t: TaskCount) => t.status === 'in-progress')?._count.status || 0 },
            { name: 'Done', count: taskCounts.find((t: TaskCount) => t.status === 'done')?._count.status || 0 },
        ];

        return NextResponse.json(formattedData);

    } catch (error) {
        console.error('[ANALYTICS_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
