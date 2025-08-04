import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    const jwtSecret = process.env.JWT_SECRET;

    //Validasi input
    if (!email || !password) {
      return new NextResponse('Email and password are required', { status: 400 });
    }

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined in your .env file");
    }

    //Cari user di database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new NextResponse('Invalid credentials', { status: 401 }); // Unauthorized
    }

    //Bandingkan password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return new NextResponse('Invalid credentials', { status: 401 }); // Unauthorized
    }

    //Buat JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '1d' } // Token berlaku selama 1 hari
    );

    //Buat respons sukses terlebih dahulu
    const { password: _, ...userWithoutPassword } = user;
    const response = NextResponse.json({ 
        message: 'Login successful', 
        user: userWithoutPassword 
    });

    //Set token di httpOnly cookie pada objek respons
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Hanya secure di production
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 hari dalam detik
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('[LOGIN_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
