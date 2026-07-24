import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { subscriptions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed:`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  try {
    switch (event.type) {
      // 1. Checkout finalizado com sucesso
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        const subscriptionId = checkoutSession.subscription as string;
        const customerId = checkoutSession.customer as string;

        if (!userId || !subscriptionId) {
          console.error('Missing metadata or subscription ID in checkout session');
          break;
        }

        // Buscar detalhes da assinatura no Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Registrar no banco de dados Neon
        await db.insert(subscriptions).values({
          id: subscriptionId,
          userId: userId,
          stripeCustomerId: customerId,
          planId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }).onConflictDoUpdate({
          target: subscriptions.id,
          set: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date(),
          }
        });

        console.log(`Subscription registered for user: ${userId}`);
        break;
      }

      // 2. Pagamento de fatura efetuado com sucesso (renovação)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Atualiza a validade e o status da assinatura
        await db.update(subscriptions)
          .set({
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));

        console.log(`Subscription payment succeeded and validity extended: ${subscriptionId}`);
        break;
      }

      // 3. Assinatura atualizada (ex: upgrade, downgrade ou cancelamento programado)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        await db.update(subscriptions)
          .set({
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id));

        console.log(`Subscription updated in Stripe: ${subscription.id}`);

        // Disparar e-mail se a assinatura entrar em atraso (past_due)
        if (subscription.status === 'past_due') {
          try {
            const localSub = await db.query.subscriptions.findFirst({
              where: eq(subscriptions.id, subscription.id),
            });
            if (localSub) {
              const user = await db.query.users.findFirst({
                where: eq(users.id, localSub.userId),
              });
              if (user) {
                const { sendBillingRecoveryEmail } = await import('@/lib/emails');
                const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://talhaodigital.com.br';
                
                await sendBillingRecoveryEmail({
                  userId: user.id,
                  email: user.email,
                  name: user.name || 'Assinante',
                  type: 'past_due_warning',
                  paymentUrl: `${origin}/dashboard`,
                  amount: subscription.items.data[0]?.price?.unit_amount || 3990,
                });
              }
            }
          } catch (err) {
            console.error('Erro ao processar e-mail de past_due no webhook:', err);
          }
        }
        break;
      }

      // 4. Assinatura cancelada definitivamente ou expirada por falta de pagamento
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Atualiza para 'canceled' no banco local
        await db.update(subscriptions)
          .set({
            status: 'canceled',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id));

        console.log(`Subscription deleted/canceled: ${subscription.id}`);
        break;
      }

      // 5. Tentativa de pagamento de fatura falhou
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          try {
            const localSub = await db.query.subscriptions.findFirst({
              where: eq(subscriptions.stripeCustomerId, customerId),
            });
            if (localSub) {
              const user = await db.query.users.findFirst({
                where: eq(users.id, localSub.userId),
              });
              if (user) {
                const { sendBillingRecoveryEmail } = await import('@/lib/emails');
                const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://talhaodigital.com.br';
                
                await sendBillingRecoveryEmail({
                  userId: user.id,
                  email: user.email,
                  name: user.name || 'Assinante',
                  type: 'payment_failed',
                  paymentUrl: `${origin}/dashboard`,
                  amount: invoice.amount_due || 3990,
                });
              }
            }
          } catch (err) {
            console.error('Erro ao processar e-mail de falha de pagamento no webhook:', err);
          }
        }
        break;
      }
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error: any) {
    console.error('Error handling Stripe webhook event:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}
