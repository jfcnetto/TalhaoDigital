import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, blogPosts, blogCategories } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Plus, Image as ImageIcon, MessageSquare, Edit3, Trash2, ExternalLink, Globe } from 'lucide-react';

interface BlogAdminPageProps {
  searchParams: {
    status?: string;
  };
}

export default async function BlogAdminPage({ searchParams }: BlogAdminPageProps) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/admin');
  }

  const selectedStatus = searchParams.status || 'all';

  let posts;
  if (selectedStatus === 'published') {
    posts = await db.query.blogPosts.findMany({
      where: eq(blogPosts.status, 'published'),
      orderBy: desc(blogPosts.createdAt),
    });
  } else if (selectedStatus === 'draft') {
    posts = await db.query.blogPosts.findMany({
      where: eq(blogPosts.status, 'draft'),
      orderBy: desc(blogPosts.createdAt),
    });
  } else if (selectedStatus === 'trash') {
    posts = await db.query.blogPosts.findMany({
      where: eq(blogPosts.status, 'trash'),
      orderBy: desc(blogPosts.createdAt),
    });
  } else {
    posts = await db.query.blogPosts.findMany({
      orderBy: desc(blogPosts.createdAt),
    });
  }

  const allPostsCount = await db.query.blogPosts.findMany();
  const publishedCount = allPostsCount.filter((p) => p.status === 'published').length;
  const draftCount = allPostsCount.filter((p) => p.status === 'draft').length;
  const trashCount = allPostsCount.filter((p) => p.status === 'trash').length;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 lg:py-12">
        <div className="space-y-8">
          
          {/* Cabeçalho WP Admin */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-neutral-200">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
                Gestão do Blog
              </h1>
              <p className="text-neutral-500 text-sm mt-1">
                Gerencie seus artigos técnicos, otimização SEO, mídias e moderação de comentários.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/blog/midia"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs shadow-2xs transition-colors"
              >
                <ImageIcon className="h-4 w-4 text-emerald-800" />
                Imagens
              </Link>

              <Link
                href="/admin/blog/comentarios"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs shadow-2xs transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-emerald-800" />
                Comentários
              </Link>

              <Link
                href="/admin/blog/novo"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Adicionar Novo Artigo
              </Link>
            </div>
          </div>

          {/* Filtros de Estado WP Style (Todos | Publicados | Rascunhos | Lixeira) */}
          <div className="flex items-center gap-2 border-b border-neutral-200 text-xs font-bold pb-2">
            <Link
              href="/admin/blog?status=all"
              className={`px-3 py-1.5 rounded-lg transition-colors ${selectedStatus === 'all' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-neutral-600 hover:bg-neutral-200'}`}
            >
              Todos ({allPostsCount.length})
            </Link>
            <Link
              href="/admin/blog?status=published"
              className={`px-3 py-1.5 rounded-lg transition-colors ${selectedStatus === 'published' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-neutral-600 hover:bg-neutral-200'}`}
            >
              Publicados ({publishedCount})
            </Link>
            <Link
              href="/admin/blog?status=draft"
              className={`px-3 py-1.5 rounded-lg transition-colors ${selectedStatus === 'draft' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-neutral-600 hover:bg-neutral-200'}`}
            >
              Rascunhos ({draftCount})
            </Link>
            <Link
              href="/admin/blog?status=trash"
              className={`px-3 py-1.5 rounded-lg transition-colors ${selectedStatus === 'trash' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-neutral-600 hover:bg-neutral-200'}`}
            >
              Lixeira ({trashCount})
            </Link>
          </div>

          {/* Tabela de Posts Estilo WordPress Admin */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xs overflow-hidden">
            {posts.length === 0 ? (
              <div className="text-center py-16 p-6 space-y-3">
                <Globe className="h-10 w-10 text-neutral-300 mx-auto" />
                <h3 className="text-base font-extrabold text-neutral-800">Nenhum post encontrado</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Você ainda não possui artigos publicados nesta aba.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100/70 border-b border-neutral-200 text-[11px] font-extrabold text-neutral-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Capa</th>
                      <th className="py-3.5 px-4">Título</th>
                      <th className="py-3.5 px-4">Autor</th>
                      <th className="py-3.5 px-4">Categoria</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Data</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-150 text-xs">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-neutral-50/80 transition-colors group">
                        <td className="py-3 px-4 w-16">
                          <div className="w-12 h-12 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-100">
                            {post.coverImage ? (
                              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-extrabold text-neutral-900 block text-sm group-hover:text-emerald-800 transition-colors">
                            {post.title}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                            /blog/{post.slug}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-semibold text-neutral-700">
                          {post.author}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10.5px] uppercase">
                            {post.category}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            post.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                            {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-neutral-500 text-[11px]">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/blog/${post.id}/editar`}
                              className="p-1.5 bg-neutral-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg text-neutral-600 transition-colors"
                              title="Editar Post"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>

                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-neutral-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg text-neutral-600 transition-colors"
                              title="Visualizar Artigo Público"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
