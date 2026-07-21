import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, blogCategories, blogTags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WpBlogEditor from '../WpBlogEditor';

export default async function NovoPostAdminPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/admin');
  }

  const categories = await db.query.blogCategories.findMany();
  const tags = await db.query.blogTags.findMany();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <WpBlogEditor categories={categories} tags={tags} />
      </main>
      <Footer />
    </div>
  );
}
