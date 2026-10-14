import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import type { Client } from '@libsql/client';

const secretKey = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-at-least-32-chars-long-12345';
const key = new TextEncoder().encode(secretKey);

export async function ensureUserProgressTable(client: Client) {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS academic_user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        material_type TEXT NOT NULL,
        material_id INTEGER NOT NULL,
        completed INTEGER DEFAULT 1,
        updated_at TEXT,
        UNIQUE(user_id, material_type, material_id)
      )
    `);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_acad_uprog ON academic_user_progress(user_id, material_type, material_id)`);
  } catch (e) {
    console.error('Failed to ensure academic_user_progress table:', e);
  }
}

export async function getUserIdFromRequest(req: NextRequest): Promise<string> {
  let token = null;

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (!token) {
    token = req.cookies.get('session')?.value || req.cookies.get('academic_token')?.value;
  }
  if (!token) {
    token = req.nextUrl?.searchParams?.get('token') || req.nextUrl?.searchParams?.get('user_id');
  }

  if (token && !token.includes('@') && token.length > 30) {
    try {
      const verified = await jwtVerify(token, key);
      if (verified.payload && verified.payload.userId) {
        return String(verified.payload.userId);
      }
    } catch {}
  }

  // Fallback to explicit user_id query param if provided
  const queryUserId = req.nextUrl?.searchParams?.get('user_id');
  if (queryUserId) return queryUserId;

  return 'owner';
}

export async function getUserCompletedSet(client: Client, userId: string): Promise<Set<string>> {
  await ensureUserProgressTable(client);
  const completedSet = new Set<string>();

  try {
    const res = await client.execute({
      sql: `SELECT material_type, material_id FROM academic_user_progress WHERE user_id = ? AND completed = 1`,
      args: [userId]
    });

    for (const row of res.rows) {
      completedSet.add(`${row.material_type}:${row.material_id}`);
    }
  } catch (e) {
    console.error('Failed to get user completed set:', e);
  }

  return completedSet;
}

export async function toggleUserProgress(
  client: Client,
  userId: string,
  materialType: string,
  materialId: number,
  explicitCompleted?: boolean
): Promise<boolean> {
  await ensureUserProgressTable(client);

  let newCompleted = 1;
  if (explicitCompleted !== undefined) {
    newCompleted = explicitCompleted ? 1 : 0;
  } else {
    // Check current state
    const currentRes = await client.execute({
      sql: `SELECT completed FROM academic_user_progress WHERE user_id = ? AND material_type = ? AND material_id = ? LIMIT 1`,
      args: [userId, materialType, materialId]
    });
    const current = currentRes.rows[0];
    if (current && Number(current.completed) === 1) {
      newCompleted = 0;
    } else {
      newCompleted = 1;
    }
  }

  const now = new Date().toISOString();
  await client.execute({
    sql: `
      INSERT INTO academic_user_progress (user_id, material_type, material_id, completed, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, material_type, material_id) 
      DO UPDATE SET completed = excluded.completed, updated_at = excluded.updated_at
    `,
    args: [userId, materialType, materialId, newCompleted, now]
  });

  return newCompleted === 1;
}
