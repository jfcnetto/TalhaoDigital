import Link from "next/link";
import { ArrowRight, Calculator, BarChart3, ShieldCheck, Calendar, User, BookOpen, WifiOff } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingGrid from "@/components/PricingGrid";
import { db } from "@/db";
import { plans, blogPosts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function Home() {
  const { userId } = auth();

  // Busca os planos ativos salvos no banco de dados (sincronizados do Stripe)
  const activePlans = await db.query.plans.findMany({
    where: eq(plans.active, true),
  });

  // Busca os 3 artigos publicados mais recentes
  const recentPosts = await db.query.blogPosts.findMany({
    where: eq(blogPosts.status, "published"),
    orderBy: desc(blogPosts.publishedAt),
    limit: 3,
  });

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900 selection:bg-emerald-200">
      {/* Header Unificado */}
      <Header />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 text-center">
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl max-w-3xl mx-auto leading-tight">
              Decisões agrícolas precisas, direto no <span className="text-emerald-800">campo</span>.
            </h1>
            <p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
              Substitua planilhas complexas por calculadoras ágeis e sempre disponíveis. Feito para agrônomos, técnicos e produtores que buscam produtividade e economia de insumos.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/ferramentas"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-900 hover:shadow-xl transition-all duration-200"
              >
                Ver Calculadoras
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#planos"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-base font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Conhecer Planos Pro
              </Link>
            </div>

            {!userId && (
              <div className="mt-12 p-5 bg-amber-50/50 border border-amber-200/60 rounded-2xl max-w-2xl mx-auto text-left flex gap-3.5 items-start shadow-3xs animate-in fade-in duration-300">
                <div className="p-2 bg-amber-100/70 text-amber-800 rounded-xl shrink-0">
                  <WifiOff className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-neutral-850 text-sm">
                    Dica para uso na Roça (Modo Offline) 🌾
                  </h4>
                  <p className="text-neutral-600 text-xs leading-relaxed">
                    Para usar nossas calculadoras em áreas sem internet, certifique-se de fazer login no aplicativo pelo menos uma vez enquanto estiver conectado ao Wi-Fi ou 4G. Sua sessão ficará salva no aparelho e, quando a internet voltar, seus laudos serão sincronizados automaticamente!
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-16 bg-white border-y border-neutral-200">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex gap-4 p-6 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl h-fit">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900">19 Ferramentas Prontas</h3>
                  <p className="mt-2 text-sm text-neutral-600">De calagem e NPK a manejo de pastagem, silagem e conversão de coordenadas GPS.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl h-fit">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900">Memória de Cálculo</h3>
                  <p className="mt-2 text-sm text-neutral-600">Transparência total. Visualize a fórmula agronômica utilizada direto nos resultados.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl h-fit">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900">Relatórios em PDF</h3>
                  <p className="mt-2 text-sm text-neutral-600">Gere laudos profissionais com dados do cliente e CREA direto do celular para envio.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Blog Posts Section */}
        {recentPosts && recentPosts.length > 0 && (
          <section className="py-16 bg-white border-b border-neutral-200">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
              <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <BookOpen className="h-3.5 w-3.5" />
                  Nosso Blog
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                  Últimos Artigos & <span className="text-emerald-800">Diagnósticos</span>
                </h2>
                <p className="text-neutral-500 text-sm">
                  Fique por dentro das novidades técnicas e melhores práticas agronômicas direto no campo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {recentPosts.map((post) => (
                  <article key={post.id} className="bg-neutral-50 border border-neutral-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group">
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

                        <h3 className="font-extrabold text-base text-neutral-900 group-hover:text-emerald-800 transition-colors leading-snug line-clamp-2">
                          <Link href={`/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>

                        <p className="text-neutral-500 text-xs leading-relaxed line-clamp-2">
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
                ))}
              </div>
              
              <div className="text-center mt-10">
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs transition-colors"
                >
                  Ver Todos os Artigos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Pricing Plans Section (#planos) */}
        <section id="planos" className="bg-neutral-50 scroll-mt-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-24">
            {/* Componente Interativo de Grade de Preços (Oculta 100% se for Pro Ativo) */}
            <PricingGrid plans={activePlans} />
          </div>
        </section>
      </main>

      {/* Rodapé Unificado */}
      <Footer />
    </div>
  );
}
