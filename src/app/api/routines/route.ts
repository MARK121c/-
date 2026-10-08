import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getClient = () => createClient({ url: process.env.DATABASE_URL || 'file:./data/sqlite.db' });

// GET all routines with their steps
export async function GET(req: NextRequest) {
  const client = getClient();
  try {
    const routinesRes = await client.execute(`SELECT * FROM routines ORDER BY id DESC`);
    const stepsRes = await client.execute(`SELECT * FROM routine_steps ORDER BY step_order ASC`);
    
    // Group steps by routineId
    const stepsByRoutine: Record<number, any[]> = {};
    stepsRes.rows.forEach((r: any) => {
      const routineId = r.routine_id ?? r[1];
      if (!stepsByRoutine[routineId]) stepsByRoutine[routineId] = [];
      stepsByRoutine[routineId].push({
        id: r.id ?? r[0],
        routineId: routineId,
        stepName: r.step_name ?? r[2],
        stepOrder: r.step_order ?? r[3],
        estimatedTime: r.estimated_time ?? r[4],
        isRequired: !!(r.is_required ?? r[5]),
        productId: r.product_id ?? r[6]
      });
    });

    const routines = routinesRes.rows.map((r: any) => {
      const id = r.id ?? r[0];
      return {
        id,
        name: r.name ?? r[1],
        type: r.type ?? r[2],
        category: r.category ?? r[3],
        isActive: !!(r.is_active ?? r[4]),
        daysOfWeek: r.days_of_week ? JSON.parse(r.days_of_week ?? r[5]) : null,
        createdAt: r.created_at ?? r[6],
        steps: stepsByRoutine[id] || []
      };
    });

    return NextResponse.json({ routines });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST create routine + steps
export async function POST(req: NextRequest) {
  const client = getClient();
  const body = await req.json();
  const { name, type = 'daily', category = 'health', daysOfWeek = null, steps = [] } = body;
  const createdAt = new Date().toISOString();

  try {
    const insertRoutine = await client.execute({
      sql: `INSERT INTO routines (name, type, category, is_active, days_of_week, created_at) VALUES (?, ?, ?, 1, ?, ?)`,
      args: [name, type, category, daysOfWeek ? JSON.stringify(daysOfWeek) : null, createdAt]
    });
    
    const routineId = Number(insertRoutine.lastInsertRowid);
    
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      await client.execute({
        sql: `INSERT INTO routine_steps (routine_id, step_name, step_order, estimated_time, is_required, product_id) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [routineId, s.stepName, i, s.estimatedTime || 5, s.hasOwnProperty('isRequired') ? (s.isRequired ? 1 : 0) : 1, s.productId || null]
      });
    }

    return NextResponse.json({ success: true, routineId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE a routine
export async function DELETE(req: NextRequest) {
  const client = getClient();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    await client.execute({ sql: `DELETE FROM routine_steps WHERE routine_id = ?`, args: [id] });
    await client.execute({ sql: `DELETE FROM routines WHERE id = ?`, args: [id] });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
