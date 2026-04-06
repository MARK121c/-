import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { transactions, assets, incomes, investments, passiveIncomeSources, wishlist } from '@/backend/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { table, id } = await request.json();

    if (!table || !id) {
      return NextResponse.json({ success: false, error: 'Missing table or id' }, { status: 400 });
    }

    let targetTable: any;
    switch (table) {
      case 'transactions': targetTable = transactions; break;
      case 'assets': targetTable = assets; break;
      case 'incomes': targetTable = incomes; break;
      case 'investments': targetTable = investments; break;
      case 'passiveIncomeSources': targetTable = passiveIncomeSources; break;
      case 'wishlist': targetTable = wishlist; break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid table' }, { status: 400 });
    }

    await db.delete(targetTable).where(eq(targetTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
