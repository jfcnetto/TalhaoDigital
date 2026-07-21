import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogForm from '../BlogForm';

export default async function NewPostPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Validar se o usuário logado é administrador
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <div className="space-y-6">
          <div className="border-b pb-4 border-neutral-200">
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
              Escrever Nova Postagem
            </h1>
            <p className="text-neutral-550 text-sm mt-0.5">
              Crie artigos ricos com imagens para engajamento e indexação no Google.
            </p>
          </div>

          <BlogForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
