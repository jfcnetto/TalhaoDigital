import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendBillingRecoveryEmail } from '@/lib/emails';

export async function POST(req: Request) {
  try {
    const { userId: callerId } = auth();

    if (!callerId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Validar se quem está chamando a API é realmente um administrador
    const caller = await db.query.users.findFirst({
      where: eq(users.id, callerId),
    });

    if (caller?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const { targetUserId, action } = await req.json();

    if (!targetUserId || action !== 'simulate-recovery') {
      return NextResponse.json({ error: 'Ação inválida ou parâmetros faltando' }, { status: 400 });
    }

    // 2. Localizar usuário alvo da simulação
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário alvo não encontrado' }, { status: 404 });
    }

    // 3. Encontrar dados de assinatura para puxar o valor
    const targetSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, targetUserId),
    });

    // Simularemos o valor padrão de R$ 39,90 se o usuário não for assinante ativo
    const simulatedAmount = 3990; 
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // 4. Disparar e-mail de recuperação simulado via Nodemailer (Ethereal)
    const result = await sendBillingRecoveryEmail({
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name || 'Assinante de Teste',
      type: 'manual_test',
      paymentUrl: `${origin}/dashboard`,
      amount: simulatedAmount,
    });

    return NextResponse.json({
      success: true,
      message: `E-mail de recuperação simulado para ${targetUser.email} enviado com sucesso!`,
      status: result.status,
      previewUrl: result.previewUrl
    });

  } catch (error: any) {
    console.error('Erro na API administrativa de cobrança:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
