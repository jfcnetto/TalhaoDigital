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

    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase();
    const isDefaultAdmin = userEmail === 'jfcnetto@gmail.com';

    // Se o usuário for Admin no Clerk ou no Postgres, ou for o e-mail de criador padrão
    const isAdmin = 
      user.publicMetadata?.role === 'admin' || 
      dbUser?.role === 'admin' ||
      isDefaultAdmin;

    // Garante que sincroniza com o Postgres
    if (isAdmin && dbUser && dbUser.role !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, userId));
      dbUser.role = 'admin';
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
