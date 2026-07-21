import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, User, ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

interface PostPageProps {
  params: {
    slug: string;
  };
}

// 1. Geração Dinâmica de Metadados SEO para Ranqueamento no Google
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.slug, params.slug),
  });

  if (!post) return {};

  return {
    title: `${post.seoTitle} - Blog Talhão Digital`,
    description: post.seoDescription,
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      images: [{ url: post.coverImage }],
      type: 'article',
      url: `https://talhaodigital.com.br/blog/${post.slug}`,
    },
    alternates: {
      canonical: `https://talhaodigital.com.br/blog/${post.slug}`,
    }
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  // Busca o artigo correspondente pelo slug único
  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.slug, params.slug),
  });

  if (!post || post.status !== 'published') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      {/* Estilos para renderizar o HTML rico do Tiptap sem dependência adicional */}
      <style>{`
        .article-content h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.25;
        }
        .article-content h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .article-content p {
          margin-bottom: 1.25rem;
          line-height: 1.7;
          color: #374151;
        }
        .article-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
          color: #374151;
        }
        .article-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
          color: #374151;
        }
        .article-content li {
          margin-bottom: 0.5rem;
        }
        .article-content a {
          color: #064e3b;
          text-decoration: underline;
          font-weight: 600;
        }
        .article-content a:hover {
          color: #022c22;
        }
      `}</style>

      <Header />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-12 lg:py-16">
        <article className="space-y-8">
          
          {/* Voltar ao Blog */}
          <div>
            <Link 
              href="/blog"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Blog
            </Link>
          </div>

          {/* Cabeçalho do Artigo */}
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              {post.category}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl leading-tight">
              {post.title}
            </h1>

            {/* Metadados */}
            <div className="flex items-center gap-6 text-xs text-neutral-500 border-y py-3 border-neutral-200">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="h-4 w-4 text-neutral-400" />
                Por {post.author}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-neutral-400" />
                Publicado em {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("pt-BR") : ''}
              </span>
            </div>
          </div>

          {/* Imagem de Capa */}
          <div className="rounded-2xl overflow-hidden shadow-md max-h-[450px] bg-neutral-100 border border-neutral-200">
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Resumo */}
          {post.summary && (
            <p className="text-lg text-neutral-600 font-medium italic border-l-4 border-emerald-850 pl-4 leading-relaxed py-1">
              {post.summary}
            </p>
          )}

          {/* Corpo do Post (Injetado via dangerouslySetInnerHTML com estilos customizados) */}
          <div 
            className="article-content text-sm sm:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

        </article>
      </main>

      <Footer />
    </div>
  );
}
