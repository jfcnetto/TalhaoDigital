import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { userId: callerId } = auth();

    if (!callerId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Validar se quem está chamando a API é realmente um administrador no Postgres
    const caller = await db.query.users.findFirst({
      where: eq(users.id, callerId),
    });

    if (caller?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const { targetUserId, action } = await req.json();

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Target User ID and action are required' }, { status: 400 });
    }

    // Obter dados do usuário alvo
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 2. Executar a ação administrativa solicitada
    if (action === 'toggle-courtesy') {
      const newValue = !targetUser.isCourtesyPro;
      
      await db.update(users)
        .set({ isCourtesyPro: newValue, updatedAt: new Date() })
        .where(eq(users.id, targetUserId));

      return NextResponse.json({ 
        success: true, 
        message: `Acesso cortesia do usuário ${newValue ? 'ativado' : 'desativado'} com sucesso.` 
      });
    }

    if (action === 'toggle-role') {
      const newRole = targetUser.role === 'admin' ? 'subscriber' : 'admin';

      // Impede o próprio administrador de remover seu próprio cargo de admin por engano
      if (targetUserId === callerId) {
        return NextResponse.json({ error: 'Você não pode revogar seu próprio acesso administrador.' }, { status: 400 });
      }

      await db.update(users)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(users.id, targetUserId));

      return NextResponse.json({ 
        success: true, 
        message: `Cargo do usuário alterado para ${newRole} com sucesso.` 
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro na API administrativa de usuários:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
