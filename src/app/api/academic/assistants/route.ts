import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import crypto from 'crypto';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });
const primarySecret = process.env.AUTH_SECRET || 'fallback-secret-at-least-32-chars-long-12345';
const secondarySecret = process.env.JWT_SECRET || 'mark-os-super-secure-production-jwt-token-key-2026';
const primaryKey = new TextEncoder().encode(primarySecret);
const secondaryKey = new TextEncoder().encode(secondarySecret);

async function verifyToken(token: string): Promise<any> {
  try {
    const verified = await jwtVerify(token, primaryKey);
    return verified.payload;
  } catch {
    try {
      const verified = await jwtVerify(token, secondaryKey);
      return verified.payload;
    } catch {
      return null;
    }
  }
}

async function isOwnerRequest(req: NextRequest): Promise<boolean> {
  let token = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }
  if (!token) {
    token = req.cookies.get('session')?.value || req.cookies.get('academic_token')?.value;
  }
  if (!token) {
    token = new URL(req.url).searchParams.get('token');
  }
  if (!token) return false;

  const payload = await verifyToken(token);
  if (!payload) return false;

  const isOwner = payload.role === 'owner' || payload.userId === 'admin' || payload.userId === 'test@mark.os';
  return Boolean(isOwner);
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function GET(req: NextRequest) {
  if (!(await isOwnerRequest(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Only owner can access assistant accounts' }, { status: 403 });
  }

  const client = getClient();
  try {
    const res = await client.execute(`SELECT id, username, role, display_name, active, created_at FROM academic_users WHERE role IN ('assistant', 'viewer') ORDER BY id DESC`);
    return NextResponse.json({ success: true, assistants: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  if (!(await isOwnerRequest(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Only owner can create accounts' }, { status: 403 });
  }

  const client = getClient();
  try {
    const body = await req.json();
    const { username, password, display_name, role = 'assistant' } = body;
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const assignedRole = role === 'viewer' ? 'viewer' : 'assistant';

    const existing = await client.execute({
      sql: `SELECT id FROM academic_users WHERE username = ?`,
      args: [username]
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Username already exists' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    const insertRes = await client.execute({
      sql: `INSERT INTO academic_users (username, password_hash, role, display_name, active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`,
      args: [username, passwordHash, assignedRole, display_name || username, now, now]
    });

    const userRes = await client.execute({
      sql: `SELECT id, username, role, display_name, active, created_at FROM academic_users WHERE id = ?`,
      args: [insertRes.lastInsertRowid!]
    });

    return NextResponse.json({ success: true, user: userRes.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isOwnerRequest(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Only owner can update accounts' }, { status: 403 });
  }

  const client = getClient();
  try {
    const body = await req.json();
    const { id, password, display_name, active, role } = body;
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const userRes = await client.execute({ sql: `SELECT * FROM academic_users WHERE id = ? AND role IN ('assistant', 'viewer')`, args: [id] });
    const user = userRes.rows[0];
    if (!user) return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });

    if (password) {
      const hash = hashPassword(password);
      await client.execute({ sql: `UPDATE academic_users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`, args: [hash, id] });
    }
    if (display_name !== undefined) {
      await client.execute({ sql: `UPDATE academic_users SET display_name = ?, updated_at = datetime('now') WHERE id = ?`, args: [display_name, id] });
    }
    if (active !== undefined) {
      await client.execute({ sql: `UPDATE academic_users SET active = ?, updated_at = datetime('now') WHERE id = ?`, args: [active ? 1 : 0, id] });
    }
    if (role !== undefined) {
      const assignedRole = role === 'viewer' ? 'viewer' : 'assistant';
      await client.execute({ sql: `UPDATE academic_users SET role = ?, updated_at = datetime('now') WHERE id = ?`, args: [assignedRole, id] });
    }

    const updated = await client.execute({ sql: `SELECT id, username, role, display_name, active, created_at, updated_at FROM academic_users WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true, user: updated.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isOwnerRequest(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Only owner can delete accounts' }, { status: 403 });
  }

  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

  try {
    await client.execute({ sql: `DELETE FROM academic_users WHERE id = ? AND role IN ('assistant', 'viewer')`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

