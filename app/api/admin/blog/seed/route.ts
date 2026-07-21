import { NextResponse } from 'next/server';
import { db } from '@/db';
import { blogCategories, blogTags } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const defaultCategories = [
      { name: 'Agricultura', slug: 'agricultura', area: 'agricultura', description: 'Artigos técnicos sobre solos, fertilidade, culturas e irrigação.' },
      { name: 'Pecuária', slug: 'pecuaria', area: 'pecuaria', description: 'Artigos técnicos sobre nutrição animal, pastagem e manejo.' },
      { name: 'Financeiro & Gestão', slug: 'financeiro', area: 'financeiro', description: 'Artigos sobre custos de produção, fluxo de caixa e gestão rural.' },
    ] as const;

    for (const cat of defaultCategories) {
      const existing = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.slug, cat.slug),
      });
      if (!existing) {
        await db.insert(blogCategories).values(cat);
      }
    }

    const defaultTags = [
      { name: 'Calagem', slug: 'calagem' },
      { name: 'Adubação', slug: 'adubacao' },
      { name: 'Milho', slug: 'milho' },
      { name: 'Soja', slug: 'soja' },
      { name: 'Quebra de Umidade', slug: 'quebra-umidade' },
      { name: 'Gestão Rural', slug: 'gestao-rural' },
    ];

    for (const tag of defaultTags) {
      const existing = await db.query.blogTags.findFirst({
        where: eq(blogTags.slug, tag.slug),
      });
      if (!existing) {
        await db.insert(blogTags).values(tag);
      }
    }

    return NextResponse.json({ success: true, message: "Categorias e Tags iniciais do Blog sincronizadas com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
