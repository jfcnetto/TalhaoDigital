import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db } from '@/db';
import { blogPosts, blogCategories } from '@/db/schema';
import { eq, desc, like, or, and } from 'drizzle-orm';
import Link from 'next/link';
import { Calendar, User, Search, Tag, ArrowRight, BookOpen } from 'lucide-react';
import AdSenseBanner from '@/components/AdSenseBanner';

export const metadata: Metadata = {
  title: 'Blog Agronômico & Diagnósticos de Precisão - Talhão Digital',
  description: 'Artigos técnicos, calculadoras e orientações sobre agricultura, pecuária e gestão financeira no campo.',
};

interface BlogIndexPageProps {
  searchParams: {
    categoria?: string;
    q?: string;
  };
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const categoryFilter = searchParams.categoria;
  const searchQuery = searchParams.q;

  let posts;
  if (categoryFilter && categoryFilter !== 'todos') {
    posts = await db.query.blogPosts.findMany({
      where: and(
        eq(blogPosts.category, categoryFilter as any),
        eq(blogPosts.status, 'published')
      ),
      orderBy: desc(blogPosts.publishedAt),
    });
  } else if (searchQuery) {
    posts = await db.query.blogPosts.findMany({
      where: and(
        or(
          like(blogPosts.title, `%${searchQuery}%`),
          like(blogPosts.summary, `%${searchQuery}%`)
        ),
        eq(blogPosts.status, 'published')
      ),
      orderBy: desc(blogPosts.publishedAt),
    });
  } else {
    posts = await db.query.blogPosts.findMany({
      where: eq(blogPosts.status, 'published'),
      orderBy: desc(blogPosts.publishedAt),
    });
  }

  const categories = await db.query.blogCategories.findMany();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-12 lg:py-16">
        <div className="space-y-12">
          
          {/* Header da Seção de Conteúdo */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <BookOpen className="h-3.5 w-3.5" />
              Conteúdo Técnico Agronômico
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
              Conhecimento Prático para a <span className="text-emerald-800">Sua Lavoura</span>
            </h1>
            <p className="text-neutral-500 text-sm sm:text-base leading-relaxed">
              Artigos desenvolvidos para auxiliar engenheiros agrônomos, técnicos e produtores rurais nas decisões do dia a dia.
            </p>

            {/* Barra de Pesquisa */}
            <form action="/blog" method="GET" className="max-w-md mx-auto pt-2">
              <div className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery || ''}
                  placeholder="Pesquisar artigos por palavra-chave (ex: umidade, solo)..."
                  className="w-full border border-neutral-200 focus:border-emerald-600 rounded-2xl py-3 pl-10 pr-4 text-xs bg-white shadow-sm"
                />
                <Search className="h-4 w-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </form>
          </div>

          {/* Categorias (Filtros) */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/blog"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !categoryFilter || categoryFilter === 'todos'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              Todos os Artigos
            </Link>
            <Link
              href="/blog?categoria=agricultura"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === 'agricultura'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              🌾 Agricultura
            </Link>
            <Link
              href="/blog?categoria=pecuaria"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === 'pecuaria'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              🐄 Pecuária
            </Link>
            <Link
              href="/blog?categoria=financeiro"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                categoryFilter === 'financeiro'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              📊 Financeiro & Gestão
            </Link>
          </div>

          {/* Banner Publicitário Agro do Topo (Seção J) */}
          <AdSenseBanner slot="top-article" />

          {/* Grade de Artigos */}
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-neutral-200 rounded-3xl p-8 max-w-md mx-auto space-y-2">
              <BookOpen className="h-10 w-10 text-neutral-300 mx-auto" />
              <h3 className="font-extrabold text-neutral-800">Nenhum artigo encontrado</h3>
              <p className="text-xs text-neutral-500">Tente buscar por outros termos ou selecione outra categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, idx) => (
                <div key={post.id} className="contents">
                  <article className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group">
                    <div className="aspect-video relative overflow-hidden bg-neutral-100">
                      <img
                        src={post.coverImage || '/logo.svg'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-emerald-950/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-700/50">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-medium">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR') : new Date(post.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-lg text-neutral-900 group-hover:text-emerald-800 transition-colors leading-snug">
                          <Link href={`/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>

                        <p className="text-neutral-500 text-xs leading-relaxed line-clamp-3">
                          {post.summary}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-neutral-150 flex items-center justify-between">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-emerald-800 font-extrabold text-xs flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          Ler Artigo Completo
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>

                  {/* Intercalar Banner Publicitário Agro a cada 3 artigos (Seção J) */}
                  {(idx + 1) % 3 === 0 && (
                    <div className="col-span-full">
                      <AdSenseBanner slot="in-article" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
