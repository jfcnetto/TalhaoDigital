import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, blogComments, blogPosts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import CommentsModerationClient from './CommentsModerationClient';

export default async function CommentsAdminPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/admin');
  }

  const comments = await db.query.blogComments.findMany({
    orderBy: desc(blogComments.createdAt),
  });

  const posts = await db.query.blogPosts.findMany();
  const postMap = new Map(posts.map((p) => [p.id, p]));

  const commentsWithPost = comments.map((c) => ({
    ...c,
    postTitle: postMap.get(c.postId)?.title || 'Artigo do Blog',
    postSlug: postMap.get(c.postId)?.slug || '',
  }));

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <div className="space-y-8">
          
          <div className="flex items-center justify-between border-b pb-6 border-neutral-200">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/blog"
                className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
                  Moderação de Comentários
                </h1>
                <p className="text-neutral-500 text-sm mt-1">
                  Aprove, rejeite ou exclua os comentários e dúvidas deixados pelos leitores nos artigos do blog.
                </p>
              </div>
            </div>
          </div>

          <CommentsModerationClient initialComments={commentsWithPost} />

        </div>
      </main>

      <Footer />
    </div>
  );
}
