import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // 1. Adicionar colunas faltantes na tabela blog_posts se não existirem
    await db.execute(sql`
      ALTER TABLE blog_posts 
      ADD COLUMN IF NOT EXISTS focus_keyword text,
      ADD COLUMN IF NOT EXISTS canonical_url text,
      ADD COLUMN IF NOT EXISTS category_id integer;
    `);

    // 2. Criar tabela blog_categories se não existir
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

    // 3. Criar tabela blog_tags se não existir
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blog_tags (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 4. Criar tabela blog_post_tags se não existir
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blog_post_tags (
        post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
    `);

    // 5. Criar tabela media_library se não existir
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

    // 6. Criar tabela blog_post_revisions se não existir
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

    // 7. Criar tabela blog_redirects se não existir
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blog_redirects (
        id SERIAL PRIMARY KEY,
        old_slug TEXT NOT NULL UNIQUE,
        new_slug TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 8. Criar tabela blog_comments se não existir
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

    // 9. Criar tabela blog_newsletters se não existir
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blog_newsletters (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 10. Inserir categorias padrões
    await db.execute(sql`
      INSERT INTO blog_categories (name, slug, area, description)
      VALUES 
        ('Agricultura', 'agricultura', 'agricultura', 'Artigos técnicos sobre solos, fertilidade, culturas e irrigação.'),
        ('Pecuária', 'pecuaria', 'pecuaria', 'Artigos técnicos sobre nutrição animal, pastagem e manejo.'),
        ('Financeiro & Gestão', 'financeiro', 'financeiro', 'Artigos sobre custos de produção, fluxo de caixa e gestão rural.')
      ON CONFLICT (slug) DO NOTHING;
    `);

    return NextResponse.json({ success: true, message: "Migração de tabelas e colunas do Blog concluída com sucesso no Neon Postgres!" });
  } catch (error: any) {
    console.error("Erro na migração do banco:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
