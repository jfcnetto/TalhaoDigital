import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, subscriptions, plans, blogPosts, reports } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminClient from './AdminClient';
import DashboardClient from '../dashboard/DashboardClient';

interface AdminPageProps {
  searchParams: {
    checkout?: string;
  };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  // 1. Obter os dados cadastrais do usuário no Postgres (role, cortesia)
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser) {
    redirect('/sign-in');
  }

  const userEmail = user.emailAddresses[0]?.emailAddress;

  // 2. Sincronização Inteligente Direta com o Stripe ao acessar a rota /admin
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

        // GARANTIA DE CHAVE ESTRANGEIRA: Garante que o plano existe na tabela plans antes de inserir a assinatura
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
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        }).onConflictDoUpdate({
          target: subscriptions.id,
          set: {
            status: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          }
        });
      }
    }
  } catch (err) {
    console.error("Erro na sincronização automática do Stripe:", err);
  }

  const isAdmin = dbUser.role === 'admin';

  // --- FLUXO 1: VISÃO DE ADMINISTRADOR DO SISTEMA ---
  if (isAdmin) {
    // Garantia de migração de colunas e tabelas do Blog no Neon Postgres
    try {
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`
        ALTER TABLE blog_posts 
        ADD COLUMN IF NOT EXISTS focus_keyword text,
        ADD COLUMN IF NOT EXISTS canonical_url text,
        ADD COLUMN IF NOT EXISTS category_id integer;
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blog_categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          area TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blog_tags (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blog_post_tags (
          post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
          tag_id INTEGER NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
          PRIMARY KEY (post_id, tag_id)
        );
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS media_library (
          id SERIAL PRIMARY KEY,
          filename TEXT NOT NULL,
          url TEXT NOT NULL,
          key TEXT NOT NULL,
          alt_text TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          width INTEGER,
          height INTEGER,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blog_post_revisions (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content_html TEXT NOT NULL,
          summary TEXT,
          author_id TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blog_redirects (
          id SERIAL PRIMARY KEY,
          old_slug TEXT NOT NULL UNIQUE,
          new_slug TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blog_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
          author_name TEXT NOT NULL,
          author_email TEXT NOT NULL,
          content TEXT NOT NULL,
          status TEXT DEFAULT 'pending' NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
    } catch (migErr) {
      console.error("Erro na auto-migração do Blog:", migErr);
    }

    const allUsers = await db.query.users.findMany({
      orderBy: desc(users.createdAt),
    });
    const allSubs = await db.query.subscriptions.findMany();
    const dbPlans = await db.query.plans.findMany();
    const allPosts = await db.query.blogPosts.findMany({
      orderBy: desc(blogPosts.createdAt),
    });

    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
        <Header />
        <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 lg:py-12">
          <div className="space-y-8">
            <div className="border-b pb-6 border-neutral-200">
              <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
                Painel Administrativo
              </h1>
              <p className="text-neutral-550 text-sm mt-1">
                Visão de Gerenciamento Geral: Controle assinaturas, gerencie cortesias e publique artigos.
              </p>
            </div>
            <AdminClient 
              initialUsers={allUsers}
              subscriptions={allSubs}
              plans={dbPlans}
              initialPosts={allPosts}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- FLUXO 2: VISÃO DO PROFISSIONAL (AGRÔNOMO, TÉCNICO, PRODUTOR) ---
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
    dbUser.isCourtesyPro === true || 
    (activeSub?.status === 'active' || activeSub?.status === 'trialing');

  let proType: 'stripe' | 'courtesy' | 'admin' | 'none' = 'none';
  if (dbUser.isCourtesyPro) proType = 'courtesy';
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
