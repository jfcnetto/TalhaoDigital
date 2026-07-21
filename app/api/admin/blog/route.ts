import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, blogPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Helper para verificar se o usuário logado é administrador
async function verifyAdmin() {
  const { userId } = auth();
  if (!userId) return null;
  const caller = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  return caller?.role === 'admin' ? caller : null;
}

// 1. Obter todos os posts (Administrativo)
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return new Response('Unauthorized', { status: 401 });

    const posts = await db.query.blogPosts.findMany({
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. Criar Novo Post
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return new Response('Unauthorized', { status: 401 });

    const data = await req.json();
    const { title, slug, summary, contentHtml, contentJson, coverImage, seoTitle, seoDescription, category, status } = data;

    if (!title || !slug || !contentHtml || !coverImage) {
      return NextResponse.json({ error: 'Título, Slug, Conteúdo e Imagem de Capa são obrigatórios' }, { status: 400 });
    }

    // Criar autor baseado no nome do admin logado
    const authorName = admin.name || 'Administrador';

    const newPost = await db.insert(blogPosts).values({
      title,
      slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
      summary: summary || '',
      contentHtml,
      contentJson: contentJson || null,
      coverImage,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || summary || '',
      category,
      status: status || 'draft',
      author: authorName,
      publishedAt: status === 'published' ? new Date() : null,
    }).returning();

    return NextResponse.json({ success: true, post: newPost[0] });
  } catch (error: any) {
    console.error('Erro ao criar post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. Atualizar Post Existente
export async function PUT(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return new Response('Unauthorized', { status: 401 });

    const data = await req.json();
    const { id, title, slug, summary, contentHtml, contentJson, coverImage, seoTitle, seoDescription, category, status } = data;

    if (!id || !title || !slug || !contentHtml || !coverImage) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const updatedPost = await db.update(blogPosts)
      .set({
        title,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        summary: summary || '',
        contentHtml,
        contentJson: contentJson || null,
        coverImage,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || summary || '',
        category,
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();

    return NextResponse.json({ success: true, post: updatedPost[0] });
  } catch (error: any) {
    console.error('Erro ao atualizar post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. Excluir Post
export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json({ error: 'ID do post é obrigatório' }, { status: 400 });
    }

    const id = Number(idStr);

    await db.delete(blogPosts).where(eq(blogPosts.id, id));

    return NextResponse.json({ success: true, message: 'Post excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
