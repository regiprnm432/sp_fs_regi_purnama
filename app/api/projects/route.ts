import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

//Fungsi untuk membuat project baru
export async function POST(request: NextRequest) {
  try {
    //Ambil data user dari header yang ditambahkan oleh middleware
    const userPayload = request.headers.get('x-user-payload');
    if (!userPayload) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const user = JSON.parse(userPayload);
    const userId = user.userId;

    //Ambil nama project dari body request
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new NextResponse('Project name is required', { status: 400 });
    }

    //Buat project baru di database
    const newProject = await prisma.project.create({
      data: {
        name,
        ownerId: userId, //Set owner project adalah user yang sedang login
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('[PROJECTS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

//Fungsi untuk mendapatkan semua project milik user
export async function GET(request: NextRequest) {
  try {
    //Ambil data user dari header
    const userPayload = request.headers.get('x-user-payload');
    if (!userPayload) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const user = JSON.parse(userPayload);
    const userId = user.userId;

    //Cari semua project di mana user adalah owner ATAU member
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId }, //Project yang dimiliki user
          { memberships: { some: { userId: userId } } }, //Project di mana user adalah member
        ],
      },
      include: {
        owner: { //Sertakan informasi owner
          select: { id: true, email: true }
        },
        memberships: { //Sertakan informasi member
          include: {
            user: {
              select: { id: true, email: true }
            }
          }
        },
        _count: { //Hitung jumlah task di setiap project
          select: { tasks: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('[PROJECTS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
