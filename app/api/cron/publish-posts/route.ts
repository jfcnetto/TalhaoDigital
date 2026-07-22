import { NextResponse } from 'next/server';
import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq, and, lte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Chave de seguranca simples ou Vercel Cron Secret
    const CRON_SECRET = process.env.CRON_SECRET || 'talhaodigital_cron_secret_2026';

    if (secret !== CRON_SECRET && request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const now = new Date();

    // Busca todos os posts agendados cuja data de publicacao ja passou ou é agora
    const scheduledPosts = await db.query.blogPosts.findMany({
      where: and(
        eq(blogPosts.status, 'scheduled'),
        lte(blogPosts.publishedAt, now)
      ),
    });

    if (scheduledPosts.length === 0) {
      return NextResponse.json({
        message: 'Nenhum post agendado pendente para publicação.',
        publishedCount: 0,
        timestamp: now.toISOString(),
      });
    }

    const publishedIds: number[] = [];

    for (const post of scheduledPosts) {
      await db
        .update(blogPosts)
        .set({
          status: 'published',
          updatedAt: now,
        })
        .where(eq(blogPosts.id, post.id));
      
      publishedIds.push(post.id);
    }

    return NextResponse.json({
      message: `Sucesso! ${publishedIds.length} post(s) agendado(s) publicado(s).`,
      publishedCount: publishedIds.length,
      publishedIds,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Erro no Cron Job de agendamento de posts:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
