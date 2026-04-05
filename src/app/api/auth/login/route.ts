import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const secretKey = process.env.AUTH_SECRET || 'fallback-secret-at-least-32-chars-long-12345';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const expectedEmail = process.env.AUTH_EMAIL || 'admin@os.com';
    const expectedPassword = process.env.AUTH_PASSWORD || 'password123';

    if (email === expectedEmail && password === expectedPassword) {
      const token = await new SignJWT({ email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);

      const response = NextResponse.json(
        { message: 'Logged in successfully' },
        { status: 200 }
      );

      // تعيين الكوكي بشكل آمن
      response.cookies.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 24 ساعة
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
