import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    //Validasi input
    if (!email || !password) {
      return new NextResponse('Email and password are required', { status: 400 });
    }

    //Cek apakah user sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse('User with this email already exists', { status: 409 }); // 409 Conflict
    }

    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Buat user baru
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    //Kembalikan data user (tanpa password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('[REGISTER_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
