import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, blogPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogForm from '../../BlogForm';

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // 1. Validar se o usuário logado é administrador
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/dashboard');
  }

  // 2. Buscar o artigo correspondente pelo ID
  const postId = Number(params.id);
  if (isNaN(postId)) {
    redirect('/admin');
  }

  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, postId),
  });

  if (!post) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <div className="space-y-6">
          <div className="border-b pb-4 border-neutral-200">
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
              Editar Artigo: {post.title}
            </h1>
            <p className="text-neutral-550 text-sm mt-0.5">
              Edite as informações e salve as alterações do post selecionado.
            </p>
          </div>

          <BlogForm post={post} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
