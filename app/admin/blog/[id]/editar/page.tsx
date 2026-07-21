import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/db';
import { users, blogPosts, blogCategories, blogTags, blogPostTags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WpBlogEditor from '../../WpBlogEditor';

interface EditarPostAdminPageProps {
  params: {
    id: string;
  };
}

export default async function EditarPostAdminPage({ params }: EditarPostAdminPageProps) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/admin');
  }

  const postId = Number(params.id);
  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, postId),
  });

  if (!post) {
    notFound();
  }

  const categories = await db.query.blogCategories.findMany();
  const tags = await db.query.blogTags.findMany();
  const postTagRows = await db.query.blogPostTags.findMany({
    where: eq(blogPostTags.postId, postId),
  });

  const initialPostWithTags = {
    ...post,
    tagIds: postTagRows.map((t) => t.tagId),
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <WpBlogEditor initialPost={initialPostWithTags} categories={categories} tags={tags} />
      </main>
      <Footer />
    </div>
  );
}
