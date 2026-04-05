import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.AUTH_SECRET || 'fallback-secret-at-least-32-chars-long-12345';
const key = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. استثناء مسارات اللوجن والـ Bot والـ Auth API والـ Static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/bot') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') // for images, icons, etc.
  ) {
    return NextResponse.next();
  }

  // 2. التحقق من وجود الـ Session (Cookie)
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 3. التحقق من صلاحية الـ JWT
    await jwtVerify(session, key);
    return NextResponse.next();
  } catch (error) {
    console.error('Invalid session, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
