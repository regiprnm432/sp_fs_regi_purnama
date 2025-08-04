import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

// Fungsi untuk mencari user berdasarkan email
export async function GET(request: NextRequest) {
  try {
    // Middleware sudah memastikan user terautentikasi, jadi kita bisa lanjut
    const { searchParams } = new URL(request.url);
    const emailQuery = searchParams.get('email');

    if (!emailQuery) {
      return new NextResponse('Email query parameter is required', { status: 400 });
    }

    // Ambil user id dari request yang sudah login untuk dikecualikan dari hasil pencarian
    const userPayload = request.headers.get('x-user-payload');
    const currentUser = userPayload ? JSON.parse(userPayload) : null;
    const currentUserId = currentUser ? currentUser.userId : null;

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: emailQuery,
        },
        // Jangan tampilkan diri sendiri dalam hasil pencarian
        id: {
          not: currentUserId,
        },
      },
      select: {
        id: true,
        email: true,
      },
      take: 5, // Batasi hasil pencarian agar tidak terlalu banyak
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error('[USERS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
