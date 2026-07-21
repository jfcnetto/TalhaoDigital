import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, mediaLibrary } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

export default async function MediaAdminPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/admin');
  }

  const mediaList = await db.query.mediaLibrary.findMany({
    orderBy: desc(mediaLibrary.createdAt),
  });

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
                  Biblioteca de Imagens
                </h1>
                <p className="text-neutral-500 text-sm mt-1">
                  Gerencie todas as imagens e fotos.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                {mediaList.length} mídia(s) cadastrada(s)
              </span>
            </div>

            {mediaList.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-2xl p-8 space-y-2">
                <ImageIcon className="h-10 w-10 text-neutral-300 mx-auto" />
                <p className="text-sm font-bold text-neutral-700">Nenhuma mídia encontrada.</p>
                <p className="text-xs text-neutral-400">As mídias enviadas pelo editor aparecerão reunidas nesta galeria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mediaList.map((item) => (
                  <div key={item.id} className="group border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50 shadow-2xs hover:shadow-md transition-all">
                    <div className="aspect-square relative overflow-hidden bg-neutral-100">
                      <img src={item.url} alt={item.altText} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    </div>
                    <div className="p-2.5 space-y-1">
                      <span className="text-[11px] font-bold text-neutral-850 truncate block">{item.filename}</span>
                      <span className="text-[10px] text-neutral-400 block truncate">Alt: {item.altText}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
