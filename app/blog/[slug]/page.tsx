import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db } from '@/db';
import { blogPosts, blogRedirects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { Calendar, User, Clock, Share2, ArrowLeft, MessageSquare, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import AdSenseBanner from '@/components/AdSenseBanner';
import BlogComments from '@/components/BlogComments';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// 1. Metadados Dinâmicos de SEO (RN-010 / RN-011)
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.slug, params.slug),
  });

  if (!post) {
    return {
      title: 'Artigo Não Encontrado - Talhão Digital',
    };
  }

  return {
    title: `${post.seoTitle || post.title} - Talhão Digital`,
    description: post.seoDescription || post.summary,
    alternates: {
      canonical: post.canonicalUrl || `https://talhaodigital.com.br/blog/${post.slug}`,
    },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.summary,
      url: `https://talhaodigital.com.br/blog/${post.slug}`,
      siteName: 'Talhão Digital',
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'pt_BR',
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.summary,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // 2. Verificar Redirecionamento 301 Automático se o slug tiver mudado (Seção H)
  const redirectRule = await db.query.blogRedirects.findFirst({
    where: eq(blogRedirects.oldSlug, params.slug),
  });

  if (redirectRule) {
    redirect(`/blog/${redirectRule.newSlug}`);
  }

  // 3. Buscar Post Publicado
  const post = await db.query.blogPosts.findFirst({
    where: and(
      eq(blogPosts.slug, params.slug),
      eq(blogPosts.status, 'published')
    ),
  });

  if (!post) {
    notFound();
  }

  // 4. Calcular tempo de leitura estimado
  const textOnly = post.contentHtml.replace(/<[^>]*>?/gm, '');
  const wordCount = textOnly.trim() ? textOnly.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  // 5. Injeção de Dados Estruturados JSON-LD Schema.org (Article) (Seção G)
  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary,
    image: [post.coverImage],
    datePublished: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Talhão Digital',
      logo: {
        '@type': 'ImageObject',
        url: 'https://talhaodigital.com.br/logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://talhaodigital.com.br/blog/${post.slug}`,
    },
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Confira este artigo técnico: ${post.title} - https://talhaodigital.com.br/blog/${post.slug}`)}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      {/* Injeção JSON-LD Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />

      <Header />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-10 lg:py-14">
        <article className="space-y-8">
          
          {/* Breadcrumb (Seção G) */}
          <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Link href="/" className="hover:text-emerald-800 transition-colors">Início</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/blog" className="hover:text-emerald-800 transition-colors">Blog</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-emerald-800 font-bold uppercase">{post.category}</span>
          </nav>

          {/* Cabeçalho do Artigo */}
          <div className="space-y-4 border-b pb-6 border-neutral-200">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              🌾 {post.category}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              {post.title}
            </h1>

            <p className="text-neutral-500 text-sm sm:text-base leading-relaxed">
              {post.summary}
            </p>

            {/* Meta autor / data / tempo de leitura */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-neutral-500 font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-bold text-neutral-800">
                  <User className="h-4 w-4 text-emerald-800" />
                  {post.author}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR') : new Date(post.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  {readingTime} min de leitura
                </span>
              </div>

              {/* Botão Compartilhar WhatsApp */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                Compartilhar no WhatsApp
              </a>
            </div>
          </div>

          {/* Imagem de Capa do Artigo */}
          <div className="aspect-video rounded-3xl overflow-hidden border border-neutral-200 shadow-md bg-neutral-100">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>

          {/* Banner Publicitário Agro do Topo (Seção J) */}
          <AdSenseBanner slot="top-article" />

          {/* Conteúdo HTML Formatado do Artigo */}
          <div 
            className="prose prose-emerald max-w-none text-neutral-800 leading-relaxed text-sm sm:text-base space-y-4 border-b pb-8 border-neutral-200"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {/* Banner Publicitário Agro do Rodapé do Artigo (Seção J) */}
          <AdSenseBanner slot="bottom-article" />

          {/* Bloco CTA Especial de Conversão para Calculadoras (Seção G) */}
          <div className="bg-gradient-to-r from-emerald-950 to-neutral-900 text-white rounded-3xl p-8 shadow-xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden my-8 border border-emerald-800">
            <div className="space-y-2 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900 text-emerald-300 text-xs font-bold uppercase">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Diagnóstico Agronômico de Precisão
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Precisa calcular a Quebra de Umidade da sua Safra?
              </h3>
              <p className="text-emerald-200 text-xs sm:text-sm max-w-md">
                Utilize nossa calculadora gratuita e emita laudos completos em PDF sem custos.
              </p>
            </div>
            <Link
              href="/ferramentas/quebra-umidade"
              className="z-10 bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 shrink-0 cursor-pointer"
            >
              Calcular Agora ➔
            </Link>
          </div>

          {/* Seção de Comentários (Seção I) */}
          <BlogComments postId={post.id} />

        </article>
      </main>

      <Footer />
    </div>
  );
}
