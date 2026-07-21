import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Verificar se o usuário já possui acesso Pro via cortesia/admin no Postgres
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (dbUser && (dbUser.role === 'admin' || dbUser.isCourtesyPro)) {
      return NextResponse.json({ 
        error: 'Você já possui acesso vitalício/cortesia liberado ao Plano Pro.' 
      }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    let priceId = body.priceId;

    // 2. Se nenhum ID de preço for passado (ou for mock), busca o preço ativo direto do Stripe automaticamente!
    if (!priceId || priceId.startsWith('price_mock')) {
      const activePrices = await stripe.prices.list({
        active: true,
        limit: 1,
      });

      if (activePrices.data.length === 0) {
        return NextResponse.json({ 
          error: 'Nenhum plano de preço ativo foi encontrado no seu Stripe Dashboard.' 
        }, { status: 400 });
      }

      priceId = activePrices.data[0].id;
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // 3. Criar a sessão do Stripe Checkout passando os metadados de userId tanto na sessão quanto na assinatura (subscription_data)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      customer_email: user.emailAddresses[0]?.emailAddress,
      success_url: `${origin}/admin?checkout=success`,
      cancel_url: `${origin}/#planos`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar sessão do Stripe Checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
