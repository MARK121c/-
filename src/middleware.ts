import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Secret keys for JWT verification
const secretKey = process.env.AUTH_SECRET || 'fallback-secret-at-least-32-chars-long-12345';
const fallbackKey = process.env.JWT_SECRET || 'mark-os-super-secure-production-jwt-token-key-2026';

const primaryKey = new TextEncoder().encode(secretKey);
const secondaryKey = new TextEncoder().encode(fallbackKey);

interface UserJwtPayload {
  userId?: string;
  role?: string;
  email?: string;
  displayName?: string;
  [key: string]: unknown;
}

/**
 * Verify JWT using primary secret key with automatic fallback
 */
async function verifySessionToken(token: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, primaryKey);
    return payload as UserJwtPayload;
  } catch {
    try {
      const { payload } = await jwtVerify(token, secondaryKey);
      return payload as UserJwtPayload;
    } catch {
      return null;
    }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public routes: /login, /api/auth/*, static assets
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/api/auth' ||
    pathname.startsWith('/api/auth/');

  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(png|jpe?g|svg|ico|css|js|webp|avif|woff2?|ttf|eot|mp4|webm|pdf|txt)$/i.test(pathname) ||
    (!pathname.startsWith('/api/') && pathname.includes('.'));

  if (isPublicRoute || isStaticAsset) {
    return NextResponse.next();
  }

  // 2. Retrieve session token (cookie named `session` or Bearer header)
  let sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    }
  }

  const isApiRequest = pathname.startsWith('/api/');

  if (!sessionToken) {
    if (isApiRequest) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'غير مصرح بالدخول' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify JWT session
  const payload = await verifySessionToken(sessionToken);
  if (!payload) {
    if (isApiRequest) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'جلسة غير صالحة أو منتهية' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = payload.role;

  // 4. Owner role has unrestricted access
  if (role === 'owner') {
    return NextResponse.next();
  }

  // 3. Assistant and Viewer roles - complete server-level isolation
  if (role === 'assistant' || role === 'viewer') {
    if (isApiRequest) {
      // BLOCK /api/academic/assistants* for non-owner
      if (
        pathname === '/api/academic/assistants' ||
        pathname.startsWith('/api/academic/assistants/')
      ) {
        return NextResponse.json(
          { error: 'Access denied', message: 'ليس لديك صلاحية الوصول لهذا القسم' },
          { status: 403 }
        );
      }

      // BLOCK /api/academic/settings PUT/POST/DELETE for non-owner
      if (
        (pathname === '/api/academic/settings' || pathname.startsWith('/api/academic/settings/')) &&
        ['PUT', 'POST', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())
      ) {
        return NextResponse.json(
          { error: 'Access denied', message: 'ليس لديك صلاحية الوصول لهذا القسم' },
          { status: 403 }
        );
      }

      // STRICTLY permit ONLY: /api/academic/*, /api/auth/*, /api/upload/*
      const isAllowedApi =
        pathname === '/api/academic' ||
        pathname.startsWith('/api/academic/') ||
        pathname === '/api/upload' ||
        pathname.startsWith('/api/upload/') ||
        pathname === '/api/auth' ||
        pathname.startsWith('/api/auth/');

      if (isAllowedApi) {
        return NextResponse.next();
      }

      // ANY other /api/* call returns 403 Forbidden
      return NextResponse.json(
        { error: 'Access denied', message: 'ليس لديك صلاحية الوصول لهذا القسم' },
        { status: 403 }
      );
    }

    // Page navigation: STRICTLY permit ONLY: / (home page)
    if (pathname === '/' || pathname === '') {
      return NextResponse.next();
    }

    // Any navigation to pages other than / redirects to /
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Fallback for any other unauthorized/unrecognized role
  if (isApiRequest) {
    return NextResponse.json(
      { error: 'Access denied', message: 'ليس لديك صلاحية الوصول لهذا القسم' },
      { status: 403 }
    );
  }
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
