import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Task, User, Membership } from "@prisma/client";

import { TaskBoard } from "./TaskBoard";
import { Button } from "@/components/ui/button";
import { TaskChart } from "./TaskChart";

// Tipe data yang diperluas
type FullTask = Task & { assignee: User | null };
type FullMember = Membership & { user: User };

// Fungsi untuk mengambil data utama project
async function getProjectData(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return null;
  const tasks: FullTask[] = await prisma.task.findMany({ where: { projectId }, include: { assignee: true } });
  const members: FullMember[] = await prisma.membership.findMany({ where: { projectId }, include: { user: true } });
  const owner = await prisma.user.findUnique({ where: { id: project.ownerId } });
  if (!owner) throw new Error("Project owner not found");
  const ownerAsMember: FullMember = { id: `owner-${project.ownerId}`, projectId: project.id, userId: project.ownerId, createdAt: project.createdAt, updatedAt: project.updatedAt, user: owner };
  const allMembers = [ownerAsMember, ...members];
  const uniqueMembers = Array.from(new Map(allMembers.map(m => [m.userId, m])).values());
  return { project, tasks, members: uniqueMembers };
}

// Fungsi untuk mengambil data analytics
async function getAnalyticsData(projectId: string) {
    const taskCounts = await prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true },
    });

    type TaskCount = { status: string; _count: { status: number | null } };

    return [
        { name: 'To Do', count: taskCounts.find((t: TaskCount) => t.status === 'todo')?._count.status || 0 },
        { name: 'In Progress', count: taskCounts.find((t: TaskCount) => t.status === 'in-progress')?._count.status || 0 },
        { name: 'Done', count: taskCounts.find((t: TaskCount) => t.status === 'done')?._count.status || 0 },
    ];
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {

  const projectId = params.id;

  const [projectData, analyticsData] = await Promise.all([
    getProjectData(projectId),
    getAnalyticsData(projectId),
  ]);

  if (!projectData) {
    notFound();
  }

  const { project, tasks, members } = projectData;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-start mb-6 gap-4">
        <div>
          <Button asChild variant="outline" className="mb-4">
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">Welcome to your project board.</p>
        </div>
        <Button asChild variant="outline">
            <Link href={`/projects/${project.id}/settings`}>
                Project Settings
            </Link>
        </Button>
      </div>

      <div className="mb-8">
        <TaskChart data={analyticsData} />
      </div>

      <TaskBoard initialTasks={tasks} members={members} projectId={project.id} />
    </div>
  );
}
