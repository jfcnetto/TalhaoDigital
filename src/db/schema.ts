import { pgTable, text, timestamp, boolean, integer, jsonb, serial, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';

// 1. Tabela de Usuários (Espelho do Clerk Auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // ID vindo diretamente do Clerk (user_id)
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role', { enum: ['admin', 'subscriber'] }).default('subscriber').notNull(),
  isCourtesyPro: boolean('is_courtesy_pro').default(false).notNull(),
  professionalType: text('professional_type'),
  creaCrtq: text('crea_crtq'),
  conselhoEstado: text('conselho_estado'),
  cpfCnpj: text('cpf_cnpj'),
  phone: text('phone'),
  logoUrl: text('logo_url'),
  avatarUrl: text('avatar_url'),
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
  clientData: jsonb('client_data'), // PF/PJ, Nome, Endereço (Opcional)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('report_user_idx').on(table.userId),
}));

// 5. Tabela de Categorias do Blog (Agricultura, Pecuária, Financeiro/Gestão)
export const blogCategories = pgTable('blog_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  area: text('area', { enum: ['agricultura', 'pecuaria', 'financeiro'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Tabela de Tags do Blog (Granular)
export const blogTags = pgTable('blog_tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Tabela de Posts do Blog (Estilo WordPress)
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
  focusKeyword: text('focus_keyword'),
  canonicalUrl: text('canonical_url'),
  categoryId: integer('category_id').references(() => blogCategories.id),
  category: text('category', { enum: ['agricultura', 'pecuaria', 'financeiro'] }).notNull(),
  status: text('status', { enum: ['draft', 'scheduled', 'published', 'trash'] }).default('draft').notNull(),
  author: text('author').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('blog_slug_idx').on(table.slug),
}));

// 8. Tabela Pivô Post <-> Tags
export const blogPostTags = pgTable('blog_post_tags', {
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => blogTags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

// 9. Tabela de Biblioteca de Mídia (Cloudflare R2 - Reutilizável)
export const mediaLibrary = pgTable('media_library', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  url: text('url').notNull(), // URL do R2
  key: text('key').notNull(), // Key no R2
  altText: text('alt_text').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Tabela de Histórico de Revisões de Posts (Versões anteriores estilo WP)
export const blogPostRevisions = pgTable('blog_post_revisions', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  contentHtml: text('content_html').notNull(),
  summary: text('summary'),
  authorId: text('author_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Tabela de Redirecionamentos 301 (Redirecionamento automático se mudar slug)
export const blogRedirects = pgTable('blog_redirects', {
  id: serial('id').primaryKey(),
  oldSlug: text('old_slug').notNull().unique(),
  newSlug: text('new_slug').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Tabela de Comentários e Moderação do Blog
export const blogComments = pgTable('blog_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  content: text('content').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'spam', 'trash'] }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Tabela de Captura de Newsletter (Leads)
export const blogNewsletters = pgTable('blog_newsletters', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Registro de Uso das Calculadoras (Analytics simples para o Painel Admin)
export const toolUsageEvents = pgTable('tool_usage_events', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  toolId: text('tool_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  toolIdIdx: index('tool_usage_idx').on(table.toolId),
}));

// 15. Logs de Recuperação de Inadimplência (E-mails de cobrança)
export const billingRecoveryLogs = pgTable('billing_recovery_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  type: text('type').notNull(), // 'payment_failed' | 'past_due_warning' | 'manual_test'
  status: text('status').notNull(), // 'sent' | 'failed' | 'simulated'
  previewUrl: text('preview_url'), // Link do Ethereal para ver o e-mail de teste enviado
  sentAt: timestamp('sent_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('billing_recovery_user_idx').on(table.userId),
}));

// 16. Configurações Globais do Sistema (SMTP, chaves de email, etc)
export const appSettings = pgTable('app_settings', {
  id: text('id').primaryKey(), // ex: 'smtp_config'
  value: jsonb('value').notNull(), // Objeto JSON contendo as chaves configuradas
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
