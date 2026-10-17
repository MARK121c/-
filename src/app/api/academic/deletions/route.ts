import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });
const primarySecret = process.env.AUTH_SECRET || 'fallback-secret-at-least-32-chars-long-12345';
const secondarySecret = process.env.JWT_SECRET || 'mark-os-super-secure-production-jwt-token-key-2026';
const primaryKey = new TextEncoder().encode(primarySecret);
const secondaryKey = new TextEncoder().encode(secondarySecret);

async function getUserFromRequest(req: NextRequest) {
  let token = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }
  if (!token) {
    token = req.cookies.get('session')?.value || req.cookies.get('academic_token')?.value;
  }
  if (!token) return null;

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

// GET: List deletion requests
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const client = getClient();
  try {
    const isOwner = user.role === 'owner' || user.userId === 'admin';
    let query = `SELECT * FROM academic_deletion_requests ORDER BY id DESC`;
    let args: any[] = [];

    if (!isOwner) {
      query = `SELECT * FROM academic_deletion_requests WHERE requested_by = ? ORDER BY id DESC`;
      args = [String(user.userId)];
    }

    const res = await client.execute({ sql: query, args });
    return NextResponse.json({ success: true, requests: res.rows, isOwner });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST: Review (Approve or Reject) a deletion request - OWNER ONLY
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const isOwner = user.role === 'owner' || user.userId === 'admin';
  if (!isOwner) {
    return NextResponse.json({ success: false, error: 'Forbidden: Only owner can approve/reject deletions' }, { status: 403 });
  }

  const client = getClient();
  try {
    const body = await req.json();
    const { requestId, action } = body; // action: 'approve' | 'reject'
    if (!requestId || !action) {
      return NextResponse.json({ success: false, error: 'requestId and action required' }, { status: 400 });
    }

    const reqRes = await client.execute({ sql: `SELECT * FROM academic_deletion_requests WHERE id = ?`, args: [requestId] });
    const delReq = reqRes.rows[0];
    if (!delReq) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      const itemType = String(delReq.item_type);
      const itemId = Number(delReq.item_id);

      // Perform actual deletion based on item_type
      if (itemType === 'subject') {
        await client.execute({ sql: `DELETE FROM academic_subjects WHERE id = ?`, args: [itemId] });
        await client.execute({ sql: `DELETE FROM academic_lectures WHERE subject_id = ?`, args: [itemId] });
        await client.execute({ sql: `DELETE FROM academic_assignments WHERE subject_id = ?`, args: [itemId] });
        await client.execute({ sql: `DELETE FROM academic_materials_resources WHERE subject_id = ?`, args: [itemId] });
        await client.execute({ sql: `DELETE FROM academic_videos WHERE subject_id = ?`, args: [itemId] });
        await client.execute({ sql: `DELETE FROM academic_folders WHERE subject_id = ?`, args: [itemId] });
        await client.execute({ sql: `DELETE FROM academic_folder_items WHERE subject_id = ?`, args: [itemId] });
      } else if (itemType === 'lecture') {
        await client.execute({ sql: `DELETE FROM academic_lectures WHERE id = ?`, args: [itemId] });
      } else if (itemType === 'assignment') {
        await client.execute({ sql: `DELETE FROM academic_assignments WHERE id = ?`, args: [itemId] });
      } else if (itemType === 'resource') {
        await client.execute({ sql: `DELETE FROM academic_materials_resources WHERE id = ?`, args: [itemId] });
      } else if (itemType === 'video') {
        await client.execute({ sql: `DELETE FROM academic_videos WHERE id = ?`, args: [itemId] });
      } else if (itemType === 'schedule') {
        await client.execute({ sql: `DELETE FROM academic_schedule WHERE id = ?`, args: [itemId] });
      } else if (itemType === 'folder') {
        await client.execute({ sql: `DELETE FROM academic_folders WHERE id = ?`, args: [itemId] });
        await client.execute({ sql: `DELETE FROM academic_folder_items WHERE folder_id = ?`, args: [itemId] });
      } else if (itemType === 'folder_item') {
        await client.execute({ sql: `DELETE FROM academic_folder_items WHERE id = ?`, args: [itemId] });
      } else if (itemType === 'exam') {
        await client.execute({ sql: `DELETE FROM academic_exams WHERE id = ?`, args: [itemId] });
      } else if (itemType === 'code_practice') {
        await client.execute({ sql: `DELETE FROM academic_code_practices WHERE id = ?`, args: [itemId] });
      }

      await client.execute({
        sql: `UPDATE academic_deletion_requests SET status = 'approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?`,
        args: [String(user.userId), now, requestId]
      });

      return NextResponse.json({ success: true, message: 'تمت الموافقة على الحذف وتنفيذه بنجاح' });
    } else {
      await client.execute({
        sql: `UPDATE academic_deletion_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = ? WHERE id = ?`,
        args: [String(user.userId), now, requestId]
      });

      return NextResponse.json({ success: true, message: 'تم رفض طلب الحذف' });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
