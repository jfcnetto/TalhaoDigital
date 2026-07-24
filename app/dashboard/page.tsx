import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, subscriptions, plans, reports } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DashboardClient from './DashboardClient';

interface DashboardPageProps {
  searchParams: {
    checkout?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  // Garantia preventiva de que as colunas novas da tabela users existam no banco antes de fazer qualquer query pelo Drizzle
  try {
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS professional_type text,
      ADD COLUMN IF NOT EXISTS crea_crtq text,
      ADD COLUMN IF NOT EXISTS conselho_estado text,
      ADD COLUMN IF NOT EXISTS cpf_cnpj text,
      ADD COLUMN IF NOT EXISTS phone text,
      ADD COLUMN IF NOT EXISTS logo_url text,
      ADD COLUMN IF NOT EXISTS avatar_url text;
    `);
  } catch (e) {
    console.warn("Erro preventivo de migração de colunas de usuário:", e);
  }

  // 1. Obter os dados cadastrais do usuário no Postgres (role, cortesia)
  let dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // Sincronização Just-in-Time se o usuário do Clerk não existir no banco Postgres
  if (!dbUser && user) {
    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (userEmail) {
      try {
        const inserted = await db.insert(users).values({
          id: userId,
          email: userEmail,
          name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Usuário",
          role: "subscriber",
        }).returning();
        dbUser = inserted[0];
      } catch (insertErr) {
        console.error("Erro no JIT Sync:", insertErr);
      }
    }
  }

  if (!dbUser) {
    redirect('/sign-in');
  }

  const userEmail = user.emailAddresses[0]?.emailAddress;

  // Garante promoção automática para jfcnetto@gmail.com
  if (dbUser && userEmail && userEmail.toLowerCase() === 'jfcnetto@gmail.com' && dbUser.role !== 'admin') {
    try {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, userId));
      dbUser.role = 'admin';
    } catch (dbUpdateErr) {
      console.error("Erro ao auto-promover para admin no dashboard:", dbUpdateErr);
    }
  }

  // 2. Sincronização Inteligente Direta com o Stripe ao acessar o Dashboard
  try {
    const sessions = await stripe.checkout.sessions.list({
      limit: 20,
    });

    // Encontra a sessão de checkout concluída deste usuário por userId ou por e-mail
    const matchedSession = sessions.data.find(
      (s) => 
        (s.status === 'complete' || s.payment_status === 'paid') &&
        (s.metadata?.userId === userId || 
         (s.customer_details?.email && userEmail && s.customer_details.email.toLowerCase() === userEmail.toLowerCase()))
    );

    if (matchedSession && matchedSession.subscription) {
      const subId = typeof matchedSession.subscription === 'string'
        ? matchedSession.subscription
        : matchedSession.subscription.id;

      const stripeSub = await stripe.subscriptions.retrieve(subId);

      if (stripeSub) {
        const priceId = stripeSub.items.data[0].price.id;

        // Garantia de que o plano existe no banco local
        const existingPlan = await db.query.plans.findFirst({
          where: eq(plans.id, priceId),
        });

        if (!existingPlan) {
          await db.insert(plans).values({
            id: priceId,
            stripeProductId: (stripeSub.items.data[0].price.product as string) || 'prod_default',
            name: 'Plano Pro',
            description: 'Acesso Pro irrestrito',
            amount: stripeSub.items.data[0].price.unit_amount || 3990,
            currency: 'brl',
            interval: 'month',
            active: true,
          }).onConflictDoNothing();
        }

        // Insere ou atualiza a assinatura no Postgres
        await db.insert(subscriptions).values({
          id: stripeSub.id,
          userId: userId,
          planId: priceId,
          stripeCustomerId: stripeSub.customer as string,
          status: stripeSub.status,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        }).onConflictDoUpdate({
          target: subscriptions.id,
          set: {
            status: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          }
        });
      }
    }
  } catch (err) {
    console.error("Erro na sincronização do Stripe no Dashboard:", err);
  }

  const activeSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  const dbPlans = await db.query.plans.findMany({
    where: eq(plans.active, true),
  });

  const userReports = await db.query.reports.findMany({
    where: eq(reports.userId, userId),
    orderBy: desc(reports.createdAt),
    limit: 10,
  });

  const isPro = 
    dbUser.role === 'admin' ||
    dbUser.isCourtesyPro === true || 
    (activeSub?.status === 'active' || activeSub?.status === 'trialing');

  let proType: 'stripe' | 'courtesy' | 'admin' | 'none' = 'none';
  if (dbUser.role === 'admin') proType = 'admin';
  else if (dbUser.isCourtesyPro) proType = 'courtesy';
  else if (activeSub?.status === 'active' || activeSub?.status === 'trialing') proType = 'stripe';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <div className="space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-neutral-200">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
                Painel do Profissional
              </h1>
              <p className="text-neutral-500 text-sm mt-1">
                Olá, {user.firstName || 'Agrônomo'}! Gerencie seus laudos emitidos e vigência da sua assinatura.
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-3 text-sm text-emerald-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info shrink-0 h-5 w-5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <div>
              <strong className="font-semibold block mb-1">Dica para uso na Roça (Modo Offline)</strong>
              Para usar nossas calculadoras em áreas sem internet, certifique-se de <strong>fazer login no aplicativo pelo menos uma vez enquanto estiver conectado ao Wi-Fi ou 4G</strong>. Sua sessão ficará salva no aparelho e, quando a internet voltar, seus laudos serão sincronizados automaticamente!
            </div>
          </div>

          <DashboardClient 
            isPro={isPro}
            proType={proType}
            plans={dbPlans}
            reports={userReports}
            subscription={activeSub || null}
          />

        </div>
      </main>
      <Footer />
    </div>
  );
}
