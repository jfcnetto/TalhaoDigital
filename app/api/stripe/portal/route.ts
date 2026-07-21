import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Localizar a assinatura ativa para obter o stripeCustomerId
    const dbSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    if (!dbSub || !dbSub.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'Nenhuma assinatura de faturamento ativa encontrada para o seu usuário.' 
      }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // 2. Criar a sessão do Portal de Faturamento do Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: dbSub.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao gerar sessão do portal de faturamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
