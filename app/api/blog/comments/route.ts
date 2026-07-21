import { NextResponse } from 'next/server';
import { db } from '@/db';
import { blogComments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET: Listar apenas os comentários aprovados de um post específico
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId é obrigatório' }, { status: 400 });
    }

    const comments = await db.query.blogComments.findMany({
      where: and(
        eq(blogComments.postId, Number(postId)),
        eq(blogComments.status, 'approved')
      ),
      orderBy: desc(blogComments.createdAt),
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Envio público de comentário (entra como 'pending' para aprovação)
export async function POST(req: Request) {
  try {
    const { postId, authorName, authorEmail, content } = await req.json();

    if (!postId || !authorName || !authorEmail || !content) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const [comment] = await db.insert(blogComments).values({
      postId: Number(postId),
      authorName,
      authorEmail,
      content,
      status: 'pending',
    }).returning();

    return NextResponse.json({ 
      success: true, 
      message: 'Seu comentário foi enviado com sucesso e está aguardando aprovação da nossa equipe!',
      comment 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
