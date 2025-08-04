import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Kunci rahasia yang sama dengan yang ada di .env Anda
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Jika tidak ada token dan user mencoba mengakses halaman/api yang dilindungi
  if (!token) {
    // Jika request adalah untuk API, kembalikan error Unauthorized
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Jika untuk halaman UI, redirect ke halaman login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verifikasi token
    const { payload } = await jwtVerify(token, secret);
    
    // Tambahkan payload (data user) ke header request agar bisa diakses di API route
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-payload', JSON.stringify(payload));

    // Lanjutkan request dengan header yang sudah dimodifikasi
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (err) {
    // Jika token tidak valid (kadaluwarsa, dll)
    console.error('Invalid token:', err);
    
    // Hapus cookie yang tidak valid
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('token', '', { maxAge: 0 });
    
    return response;
  }
}

// Konfigurasi matcher untuk menentukan route mana yang akan dilindungi oleh middleware
export const config = {
  matcher: [
    /*
     * Cocokkan semua path request kecuali untuk:
     * - api/auth (untuk login dan register)
     * - _next/static (file statis)
     * - _next/image (optimasi gambar)
     * - favicon.ico (file ikon)
     * - halaman login dan register
     */
    '/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)',
  ],
};
