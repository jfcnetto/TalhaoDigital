import { pgTable, text, timestamp, boolean, integer, jsonb, serial, index, uniqueIndex } from 'drizzle-orm/pg-core';

// 1. Tabela de Usuários (Espelho do Clerk Auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // ID vindo diretamente do Clerk (user_id)
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role', { enum: ['admin', 'subscriber'] }).default('subscriber').notNull(),
  isCourtesyPro: boolean('is_courtesy_pro').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
}));

// 2. Tabela de Planos (Sincronizada do Stripe)
export const plans = pgTable('plans', {
  id: text('id').primaryKey(), // ID do Preço no Stripe (ex: price_xxx)
  stripeProductId: text('stripe_product_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  amount: integer('amount').notNull(), // Em centavos de BRL (ex: 2990 = R$ 29,90)
  currency: text('currency').default('brl').notNull(),
  interval: text('interval', { enum: ['month', 'year'] }).notNull(),
  active: boolean('active').default(true).notNull(),
  features: jsonb('features').default([]).notNull(), // Lista de features inclusas (ex: string[])
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Tabela de Assinaturas (Sincronizada via Webhook do Stripe)
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(), // ID da Assinatura no Stripe (sub_xxx)
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  planId: text('plan_id').notNull().references(() => plans.id),
  status: text('status').notNull(), // active, trialing, past_due, canceled, unpaid
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sub_user_idx').on(table.userId),
}));

// 4. Tabela de Relatórios (Histórico de Calculadoras - Exclusivo Pro)
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toolId: text('tool_id').notNull(), // ex: 'calagem-gessagem', 'npk-balance'
  area: text('area', { enum: ['agricultura', 'pecuaria', 'financeiro'] }).notNull(),
  inputs: jsonb('inputs').notNull(), // Inputs preenchidos pelo usuário (JSON)
  results: jsonb('results').notNull(), // Resultados calculados (JSON)
  professionalData: jsonb('professional_data'), // Nome, CREA, etc. (Opcional)
  clientData: jsonb('client_data'), // PF/PJ, Nome, Endereço (Opcional)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('report_user_idx').on(table.userId),
}));

// 5. Tabela de Posts do Blog
export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  summary: text('summary').notNull(),
  contentHtml: text('content_html').notNull(), // Conteúdo renderizado
  contentJson: jsonb('content_json'), // Dados estruturados do Tiptap
  coverImage: text('cover_image').notNull(), // URL no Cloudflare R2
  seoTitle: text('seo_title').notNull(),
  seoDescription: text('seo_description').notNull(),
  category: text('category', { enum: ['agricultura', 'pecuaria', 'financeiro'] }).notNull(),
  status: text('status', { enum: ['draft', 'published'] }).default('draft').notNull(),
  author: text('author').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('blog_slug_idx').on(table.slug),
}));

// 6. Registro de Uso das Calculadoras (Analytics simples para o Painel Admin)
export const toolUsageEvents = pgTable('tool_usage_events', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // Null se visitante anônimo
  toolId: text('tool_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  toolIdIdx: index('tool_usage_idx').on(table.toolId),
}));
