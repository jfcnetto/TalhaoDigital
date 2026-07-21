import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ isPro: false, role: 'guest' });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const activeSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const isPro = 
      dbUser?.role === 'admin' || 
      dbUser?.isCourtesyPro === true || 
      (activeSub?.status === 'active' || activeSub?.status === 'trialing');

    return NextResponse.json({ 
      isPro, 
      role: dbUser?.role || 'subscriber',
      isCourtesy: dbUser?.isCourtesyPro || false 
    });
  } catch (error) {
    return NextResponse.json({ isPro: false, role: 'subscriber' });
  }
}
