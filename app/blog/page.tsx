import type { Metadata } from 'next';
import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog Agro & Precisão - Talhão Digital',
  description: 'Leia artigos e diagnósticos sobre agricultura de precisão, calagem, gessagem e técnicas eficientes de plantio e fertilização.',
  keywords: ['blog agricola', 'dicas de cultivo', 'agricultura de precisao', 'analise de solo', 'talhao digital'],
  openGraph: {
    title: 'Blog Agro & Precisão - Talhão Digital',
    description: 'Diagnósticos e práticas eficientes sobre manejo e fertilidade do solo.',
    url: 'https://talhaodigital.com.br/blog',
    type: 'website',
  },
};

export default async function BlogPage() {
  // Busca todos os posts publicados
  const publishedPosts = await db.query.blogPosts.findMany({
    where: eq(blogPosts.status, 'published'),
    orderBy: desc(blogPosts.createdAt),
  });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-12 lg:py-16">
        <div className="space-y-12">
          
          {/* Cabeçalho do Blog */}
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <BookOpen className="h-3.5 w-3.5" />
              Portal Técnico Agro
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl leading-tight">
              Artigos, Diagnósticos e <br />
              <span className="text-emerald-800">Práticas Agronômicas</span>
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
              Fique por dentro das novidades da agricultura de precisão, dicas de manejo e análises de fertilidade do solo feitas por especialistas.
            </p>
          </div>

          {/* Grid de Artigos */}
          {publishedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                  {/* Capa */}
                  <Link href={`/blog/${post.slug}`} className="block overflow-hidden h-48 bg-neutral-100 relative">
                    <img 
                      src={post.coverImage} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                    />
                  </Link>

                  {/* Informações */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      {/* Categoria */}
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                        {post.category}
                      </span>
                      
                      {/* Título */}
                      <h2 className="font-extrabold text-lg text-neutral-900 leading-tight group-hover:text-emerald-850 transition-colors">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>

                      {/* Resumo */}
                      <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                        {post.summary}
                      </p>
                    </div>

                    {/* Metadados e Link */}
                    <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-450">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("pt-BR") : ''}
                        </span>
                      </div>
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="text-emerald-850 font-bold hover:text-emerald-950 inline-flex items-center gap-0.5"
                      >
                        Ler
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white border border-neutral-200 rounded-3xl p-8 max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-800 text-sm">Nenhum artigo publicado</h3>
                <p className="text-neutral-500 text-xs mt-1">Nossos agrônomos estão preparando os primeiros artigos para você. Volte em breve!</p>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
