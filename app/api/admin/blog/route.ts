import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, blogPosts, blogCategories, blogTags, blogPostTags, blogPostRevisions, blogRedirects } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// Função utilitária para checar Admin no Clerk e no Postgres
async function checkAdmin(userId: string) {
  const user = await currentUser();
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const isAdmin = user?.publicMetadata?.role === 'admin' || dbUser?.role === 'admin';
  return { isAdmin, dbUser };
}

// GET: Listar todos os posts para o painel admin (com suporte a filtros por status)
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { isAdmin } = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let posts;
    if (status && status !== 'all') {
      posts = await db.query.blogPosts.findMany({
        where: eq(blogPosts.status, status as any),
        orderBy: desc(blogPosts.createdAt),
      });
    } else {
      posts = await db.query.blogPosts.findMany({
        orderBy: desc(blogPosts.createdAt),
      });
    }

    const categories = await db.query.blogCategories.findMany();
    const tags = await db.query.blogTags.findMany();

    return NextResponse.json({ posts, categories, tags });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Criar um novo post do blog
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { isAdmin, dbUser } = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const body = await req.json();
    let {
      title,
      slug,
      summary,
      contentHtml,
      contentJson,
      coverImage,
      seoTitle,
      seoDescription,
      focusKeyword,
      canonicalUrl,
      categoryId,
      category,
      status,
      tagIds,
    } = body;

    // Higienização de segurança do slug
    slug = slug ? slug.trim().toLowerCase().replace(/\s+/g, '-') : slug;

    // Verificar colisão de slug
    const existingSlug = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug),
    });

    if (existingSlug) {
      return NextResponse.json({ error: 'O slug informado já está em uso por outro artigo.' }, { status: 400 });
    }

    const [newPost] = await db.insert(blogPosts).values({
      title,
      slug,
      summary,
      contentHtml,
      contentJson,
      coverImage,
      seoTitle,
      seoDescription,
      focusKeyword: focusKeyword || null,
      canonicalUrl: canonicalUrl || null,
      categoryId: categoryId || null,
      category: category || 'agricultura',
      status: status || 'draft',
      author: dbUser?.name || 'Equipe Talhão Digital',
      publishedAt: status === 'published' ? new Date() : null,
    }).returning();

    // Vincular Tags se fornecidas
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await db.insert(blogPostTags).values({
          postId: newPost.id,
          tagId: Number(tagId),
        }).onConflictDoNothing();
      }
    }

    // Salvar primeira revisão no Histórico
    await db.insert(blogPostRevisions).values({
      postId: newPost.id,
      title: newPost.title,
      contentHtml: newPost.contentHtml,
      summary: newPost.summary,
      authorId: userId,
    });

    return NextResponse.json({ success: true, post: newPost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Editar post existente + Suporte a 301 Redirect se o slug mudar
export async function PUT(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { isAdmin } = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    let { id, title, slug, summary, contentHtml, contentJson, coverImage, seoTitle, seoDescription, focusKeyword, canonicalUrl, categoryId, category, status, tagIds } = body;

    // Higienização de segurança do slug
    slug = slug ? slug.trim().toLowerCase().replace(/\s+/g, '-') : slug;

    const currentPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
    });

    if (!currentPost) {
      return NextResponse.json({ error: 'Artigo não encontrado.' }, { status: 404 });
    }

    // Se o slug mudou, salvar regra de 301 Redirect automático
    if (currentPost.slug !== slug) {
      // 1. Deletar possível regra reversa para evitar loop infinito (A -> B e B -> A)
      await db.delete(blogRedirects).where(
        and(
          eq(blogRedirects.oldSlug, slug),
          eq(blogRedirects.newSlug, currentPost.slug)
        )
      );

      // 2. Inserir a nova regra (Antigo -> Novo)
      await db.insert(blogRedirects).values({
        oldSlug: currentPost.slug,
        newSlug: slug,
      }).onConflictDoNothing();
    }

    // Gravar versão anterior no histórico de revisões
    await db.insert(blogPostRevisions).values({
      postId: currentPost.id,
      title: currentPost.title,
      contentHtml: currentPost.contentHtml,
      summary: currentPost.summary,
      authorId: userId,
    });

    const [updatedPost] = await db.update(blogPosts)
      .set({
        title,
        slug,
        summary,
        contentHtml,
        contentJson,
        coverImage,
        seoTitle,
        seoDescription,
        focusKeyword: focusKeyword || null,
        canonicalUrl: canonicalUrl || null,
        categoryId: categoryId || null,
        category: category || 'agricultura',
        status,
        publishedAt: status === 'published' && !currentPost.publishedAt ? new Date() : currentPost.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();

    // Sincronizar Tags
    if (tagIds && Array.isArray(tagIds)) {
      await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
      for (const tagId of tagIds) {
        await db.insert(blogPostTags).values({
          postId: id,
          tagId: Number(tagId),
        }).onConflictDoNothing();
      }
    }

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Mover para a Lixeira ou Excluir Definitivamente
export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { isAdmin } = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id) return NextResponse.json({ error: 'ID do artigo obrigatório' }, { status: 400 });

    if (permanent) {
      await db.delete(blogPosts).where(eq(blogPosts.id, Number(id)));
    } else {
      await db.update(blogPosts).set({ status: 'trash' }).where(eq(blogPosts.id, Number(id)));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
