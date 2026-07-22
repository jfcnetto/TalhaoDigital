import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, blogPostRevisions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET: Buscar revisões passadas de um post
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const user = await currentUser();
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const isAdmin = user?.publicMetadata?.role === 'admin' || dbUser?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId é obrigatório' }, { status: 400 });
    }

    const revisions = await db.query.blogPostRevisions.findMany({
      where: eq(blogPostRevisions.postId, Number(postId)),
      orderBy: desc(blogPostRevisions.createdAt),
      limit: 20,
    });

    return NextResponse.json({ revisions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
