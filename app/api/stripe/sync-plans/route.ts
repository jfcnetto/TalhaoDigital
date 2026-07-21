import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { plans } from '@/db/schema';
import Stripe from 'stripe';

export async function GET() {
  try {
    // Busca todos os preços ativos e expande os produtos vinculados
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    for (const price of prices.data) {
      const product = price.product as Stripe.Product;
      
      // Apenas sincroniza se o produto estiver ativo
      if (!product.active) continue;

      // Obtém as features descritas nas meta-informações do produto no Stripe
      const features = (product.metadata && product.metadata.features) 
        ? JSON.parse(product.metadata.features)
        : [];

      await db.insert(plans).values({
        id: price.id, // price_xxx
        stripeProductId: product.id, // prod_xxx
        name: product.name,
        description: product.description || null,
        amount: price.unit_amount || 0,
        currency: price.currency,
        interval: price.recurring?.interval === 'year' ? 'year' : 'month',
        active: true,
        features: features,
      }).onConflictDoUpdate({
        target: plans.id,
        set: {
          stripeProductId: product.id,
          name: product.name,
          description: product.description || null,
          amount: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval === 'year' ? 'year' : 'month',
          active: true,
          features: features,
          updatedAt: new Date(),
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Planos sincronizados com sucesso! Total sincronizado: ${prices.data.length}` 
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar planos do Stripe:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
