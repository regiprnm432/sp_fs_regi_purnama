import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    //Buat respons JSON terlebih dahulu
    const response = NextResponse.json({ message: 'Logout successful' });

    //Hapus cookie dengan mengatur maxAge ke 0 pada objek respons
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, //Langsung expired
      path: '/',
    });

    return response;
    
  } catch (error) {
    console.error('[LOGOUT_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
