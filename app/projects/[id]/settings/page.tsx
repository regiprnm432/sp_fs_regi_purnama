// app/projects/[id]/settings/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { User, Membership, Project } from "@prisma/client";

import { SettingsClient } from "./SettingsClient";

type FullMember = Membership & { user: User };

async function getSettingsData(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return null;
  }

  const members: FullMember[] = await prisma.membership.findMany({
    where: { projectId },
    include: { user: true },
  });

  const owner = await prisma.user.findUnique({ where: { id: project.ownerId } });
  if (owner) {
    // Tambahkan owner ke daftar member agar bisa ditampilkan
    members.unshift({
        id: `owner-${owner.id}`,
        projectId: project.id,
        userId: owner.id,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        user: owner
    });
  }

  return { project, members };
}

export default async function ProjectSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getSettingsData(params.id);

  if (!data) {
    notFound();
  }

  const { project, members } = data;

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Project Settings</h1>
        <p className="text-gray-500">Manage settings for {project.name}</p>
      </div>

      <SettingsClient project={project} members={members} />
    </div>
  );
}
