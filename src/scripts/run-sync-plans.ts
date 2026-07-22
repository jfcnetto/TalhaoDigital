import { db } from '@/db';
import { plans } from '@/db/schema';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

async function syncPlans() {
  console.log("Iniciando a sincronização dos planos do Stripe...");
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    console.log(`Encontrados ${prices.data.length} preços no Stripe.`);

    for (const price of prices.data) {
      const product = price.product as Stripe.Product;

      if (!product.active) continue;

      const features = (product.metadata && product.metadata.features) 
        ? JSON.parse(product.metadata.features)
        : ["Acesso ilimitado a todas as calculadoras", "Geração de laudos ilimitados em PDF", "Suporte prioritário agronômico"];

      await db.insert(plans).values({
        id: price.id,
        stripeProductId: product.id,
        name: product.name || 'Plano Pro',
        description: product.description || 'Assinatura ilimitada do Talhão Digital SaaS',
        amount: price.unit_amount || 3990,
        currency: price.currency || 'brl',
        interval: price.recurring?.interval === 'year' ? 'year' : 'month',
        active: true,
        features: features,
      }).onConflictDoUpdate({
        target: plans.id,
        set: {
          stripeProductId: product.id,
          name: product.name || 'Plano Pro',
          description: product.description || 'Assinatura ilimitada do Talhão Digital SaaS',
          amount: price.unit_amount || 3990,
          currency: price.currency || 'brl',
          interval: price.recurring?.interval === 'year' ? 'year' : 'month',
          active: true,
          features: features,
          updatedAt: new Date(),
        }
      });

      console.log(`Plano sincronizado com sucesso: ${product.name} (${price.id})`);
    }

    console.log("Sincronização concluída com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro na sincronização:", error);
    process.exit(1);
  }
}

syncPlans();
