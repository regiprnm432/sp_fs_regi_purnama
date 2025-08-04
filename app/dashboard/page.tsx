import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import Link from "next/link";
import type { Project } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateProjectButton } from "./CreateProjectButton";
import { LogoutButton } from "./LogoutButton"; // <-- Import tombol logout

interface UserPayload {
  userId: string;
  email: string;
}

type ProjectWithDetails = Project & {
  _count: { tasks: number };
  owner: { email: string | null };
};

async function getProjects(userId: string): Promise<ProjectWithDetails[]> {
  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: userId }, { memberships: { some: { userId } } }] },
    include: {
      _count: { select: { tasks: true } },
      owner: { select: { email: true } }
    },
    orderBy: { updatedAt: 'desc' },
  });
  return projects as ProjectWithDetails[];
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    return <div>Unauthorized</div>;
  }

  const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET)) as { payload: UserPayload };
  const projects = await getProjects(payload.userId);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Proyek Anda</h1>
        <div className="flex items-center gap-4">
          <CreateProjectButton />
          <LogoutButton />
        </div>
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Anda belum memiliki proyek.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
              <Card className="hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>Dimiliki oleh: {project.owner.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{project._count.tasks} tugas</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
