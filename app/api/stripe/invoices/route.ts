import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Obter a assinatura do usuário para localizar o stripeCustomerId
    const dbSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    if (!dbSub || !dbSub.stripeCustomerId) {
      // Retorna uma lista vazia sem dar erro para usuários não assinantes
      return NextResponse.json([]);
    }

    // 2. Buscar faturas diretamente no Stripe
    const invoices = await stripe.invoices.list({
      customer: dbSub.stripeCustomerId,
      limit: 10,
    });

    // 3. Formatar a resposta com campos simples e seguros
    const formattedInvoices = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number || 'N/A',
      amountPaid: inv.amount_paid, // em centavos
      total: inv.total, // em centavos
      status: inv.status,
      created: inv.created, // timestamp unix
      pdfUrl: inv.invoice_pdf || null,
      hostedInvoiceUrl: inv.hosted_invoice_url || null,
    }));

    return NextResponse.json(formattedInvoices);
  } catch (error: any) {
    console.error('Erro ao listar faturas do usuário no Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
