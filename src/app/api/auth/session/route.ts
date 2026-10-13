import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { sessions } from '@/backend/db/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET || 'mark-os-super-secure-production-jwt-token-key-2026';
const key = new TextEncoder().encode(JWT_SECRET);

export async function GET(req: NextRequest) {
  try {
    let token = null;

    // Check header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Check cookie
    if (!token) {
      token = req.cookies.get('session')?.value || req.cookies.get('academic_token')?.value;
    }

    // Check query
    if (!token) {
      token = new URL(req.url).searchParams.get('token');
    }

    if (!token) {
      return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 401 });
    }

    // Verify JWT
    let payload: any;
    try {
      const verified = await jwtVerify(token, key);
      payload = verified.payload;
    } catch {
      return NextResponse.json({ valid: false, error: 'Token expired or invalid' }, { status: 401 });
    }

    // Check if session exists in DB (kicked out if 3rd device logged in)
    try {
      const activeSession = await db.select().from(sessions).where(eq(sessions.id, token)).limit(1);
      if (activeSession.length === 0) {
        return NextResponse.json({
          valid: false,
          kickedOut: true,
          error: 'تم تسجيل الدخول من جهاز آخر. الحد الأقصى للجلسات هو جهازين فقط.',
        }, { status: 401 });
      }

      // Update last seen
      await db.update(sessions).set({ lastSeen: new Date() }).where(eq(sessions.id, token));
    } catch (dbErr) {
      // If DB check fails, fallback to valid token
    }

    return NextResponse.json({
      valid: true,
      user: {
        userId: payload.userId,
        role: payload.role,
        displayName: payload.displayName,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
