// app/projects/[id]/settings/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import type { User, Membership, Project } from "@prisma/client";

import { SettingsClient } from "./SettingsClient";
import { Button } from "@/components/ui/button";

type FullMember = Membership & { user: User };

async function getSettingsData(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return null;

  const members: FullMember[] = await prisma.membership.findMany({ where: { projectId }, include: { user: true } });
  const owner = await prisma.user.findUnique({ where: { id: project.ownerId } });
  if (owner) {
    members.unshift({ id: `owner-${owner.id}`, projectId: project.id, userId: owner.id, createdAt: project.createdAt, updatedAt: project.updatedAt, user: owner });
  }

  return { project, members };
}

export default async function ProjectSettingsPage({ params }: { params: { id: string } }) {
  const data = await getSettingsData(params.id);
  if (!data) notFound();
  const { project, members } = data;

  return (
    <div className="container mx-auto py-8 max-w-3xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
            <Link href={`/projects/${project.id}`}>← Back to Project</Link>
        </Button>
        <h1 className="text-3xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground">Manage settings for {project.name}</p>
      </div>
      <SettingsClient project={project} members={members} />
    </div>
  );
}
