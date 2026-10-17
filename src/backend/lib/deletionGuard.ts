import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { jwtVerify } from 'jose';

const primarySecret = process.env.AUTH_SECRET || 'fallback-secret-at-least-32-chars-long-12345';
const secondarySecret = process.env.JWT_SECRET || 'mark-os-super-secure-production-jwt-token-key-2026';
const primaryKey = new TextEncoder().encode(primarySecret);
const secondaryKey = new TextEncoder().encode(secondarySecret);

export async function getUserSession(req: NextRequest) {
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

export interface DeletionTarget {
  itemType: 'subject' | 'lecture' | 'assignment' | 'resource' | 'video' | 'schedule' | 'exam' | 'folder' | 'folder_item' | 'code_practice';
  itemId: number;
  itemTitle: string;
  reason?: string;
}

export async function handleGuardedDeletion(
  req: NextRequest,
  client: any,
  target: DeletionTarget,
  executeDeleteFn: () => Promise<void>
) {
  const session = await getUserSession(req);
  const isOwner = session ? (session.role === 'owner' || session.userId === 'admin') : false;

  if (isOwner) {
    // Owner deletes directly
    await executeDeleteFn();
    return NextResponse.json({
      success: true,
      pendingApproval: false,
      message: 'تم الحذف بنجاح'
    });
  }

  // Non-owner: MUST be queued for owner approval!
  const requestedBy = session?.userId ? String(session.userId) : 'assistant';
  const requestedByName = session?.displayName ? String(session.displayName) : 'مساعد الكلية';
  const now = new Date().toISOString();

  await client.execute({
    sql: `
      INSERT INTO academic_deletion_requests 
      (item_type, item_id, item_title, requested_by, requested_by_name, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `,
    args: [target.itemType, target.itemId, target.itemTitle, requestedBy, requestedByName, target.reason || 'طلب حذف من المساعد', now]
  });

  return NextResponse.json({
    success: true,
    pendingApproval: true,
    message: 'تم إرسال طلب الحذف إلى المالك للموافقة والتأكيد قبل الحذف النهائي'
  });
}
