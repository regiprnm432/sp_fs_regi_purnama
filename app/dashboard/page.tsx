// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import Link from "next/link";
// --- DIPERBAIKI: Mengimpor tipe Project secara langsung ---
import type { Project } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateProjectButton } from "./CreateProjectButton";

// Tipe untuk data user dari JWT
interface UserPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Mendefinisikan tipe secara manual untuk mencakup relasi
type ProjectWithDetails = Project & {
  _count: {
    tasks: number;
  };
  owner: {
    email: string | null;
  };
};


// Fungsi untuk mengambil data project dengan tipe return yang jelas
async function getProjects(userId: string): Promise<ProjectWithDetails[]> {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { memberships: { some: { userId: userId } } },
      ],
    },
    include: {
      _count: {
        select: { tasks: true },
      },
      owner: {
        select: { email: true }
      }
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
  // Type assertion untuk memastikan tipe data sesuai
  return projects as ProjectWithDetails[];
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    // Ini seharusnya tidak terjadi karena ada middleware, tapi sebagai pengaman
    return <div>Unauthorized</div>;
  }

  // Decode token untuk mendapatkan userId
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET)
  ) as { payload: UserPayload };
  
  const projects = await getProjects(payload.userId);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <CreateProjectButton />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">You don&apos;t have any projects yet.</p>
          <p className="text-gray-400 text-sm">Click "Create New Project" to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
              <Card className="hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    Owned by: {project.owner.email}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">
                    {project._count.tasks} task(s)
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
