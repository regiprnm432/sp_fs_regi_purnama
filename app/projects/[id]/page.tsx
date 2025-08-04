import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Task, User, Membership, Project } from "@prisma/client";

import { TaskBoard } from "./TaskBoard";
import { Button } from "@/components/ui/button";

// Tipe data yang diperluas
type FullTask = Task & { assignee: User | null };
type FullMember = Membership & { user: User };

// Fungsi untuk mengambil semua data yang dibutuhkan
async function getProjectData(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return null;
  }

  const tasks: FullTask[] = await prisma.task.findMany({
    where: { projectId },
    include: { assignee: true },
  });

  const members: FullMember[] = await prisma.membership.findMany({
    where: { projectId },
    include: { user: true },
  });
  
  // Tambahkan owner ke dalam daftar member agar bisa di-assign task
  const ownerAsMember: FullMember = { 
    id: `owner-${project.ownerId}`, 
    projectId: project.id, 
    userId: project.ownerId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    user: await prisma.user.findUnique({ where: { id: project.ownerId } }) as User
  };

  // Gabungkan dan hapus duplikat jika owner juga sudah ada di 'members'
  const allMembers = [ownerAsMember, ...members];
  const uniqueMembers = Array.from(new Map(allMembers.map(m => [m.userId, m])).values());

  return { project, tasks, members: uniqueMembers };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Middleware sudah melakukan otorisasi, tapi kita fetch lagi untuk data terbaru
  const data = await getProjectData(params.id);

  if (!data) {
    notFound(); // Menampilkan halaman 404 jika project tidak ditemukan
  }

  const { project, tasks, members } = data;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-500">Welcome to your project board.</p>
        </div>
        <Button asChild variant="outline">
            <Link href={`/projects/${project.id}/settings`}>
                Project Settings
            </Link>
        </Button>
      </div>

      <TaskBoard initialTasks={tasks} members={members} projectId={project.id} />
    </div>
  );
}
