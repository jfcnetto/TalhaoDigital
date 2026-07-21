import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ isPro: false, role: 'guest' });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Se o usuário for Admin no Clerk ou no Postgres, é sempre Admin
    const isAdmin = 
      user.publicMetadata?.role === 'admin' || 
      dbUser?.role === 'admin';

    // Garante que se for admin no Clerk, sincroniza com o Postgres
    if (isAdmin && dbUser && dbUser.role !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, userId));
    }

    const activeSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    // Regra Fundamental: ADMINS E CORTESIAS TÊM ACESSO PRO TOTAL E IRRESTRITO AUTOMÁTICO
    const isPro = 
      isAdmin === true || 
      dbUser?.isCourtesyPro === true || 
      (activeSub?.status === 'active' || activeSub?.status === 'trialing');

    return NextResponse.json({ 
      isPro, 
      role: isAdmin ? 'admin' : (dbUser?.role || 'subscriber'),
      isCourtesy: dbUser?.isCourtesyPro || false 
    });
  } catch (error) {
    return NextResponse.json({ isPro: false, role: 'subscriber' });
  }
}
