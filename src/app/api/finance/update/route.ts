import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { wishlist } from '@/backend/db/schema';
import { eq } from 'drizzle-orm';
import { calcHoursCost, calculateHourlyRate } from '@/backend/lib/finance';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { type, id, data } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    if (type === 'wishlist') {
      const hourlyRate = await calculateHourlyRate();
      const price = parseFloat(data.price || '0');
      const hoursCost = calcHoursCost(price, hourlyRate);
      
      const updateData: any = {
        name: data.name,
        price,
        currency: 'EGP',
        link: data.link || null,
        hoursCost,
        priority: parseInt(data.priority || '1'),
        notes: data.notes || '',
      };
      
      if (data.isPurchased !== undefined) {
          updateData.isPurchased = data.isPurchased;
      }

      await db.update(wishlist).set(updateData).where(eq(wishlist.id, id));
      return NextResponse.json({ success: true });
    }
    
    if (type === 'wishlist_achieve') {
        await db.update(wishlist).set({ isPurchased: true }).where(eq(wishlist.id, id));
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('API ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
