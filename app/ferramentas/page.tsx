"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { 
  Sprout, Settings, Wheat, Scale, Warehouse, 
  Dna, TrendingUp, Calendar, Coins, PiggyBank, 
  Leaf, Search, Lock, ShieldCheck, CheckCircle2, ChevronRight 
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { calculadoras, Calculadora } from "@/lib/calculadoras";

export default function FerramentasPage() {
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const [userStatus, setUserStatus] = useState<{ isPro: boolean; role: string } | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // Carrega status da conta do usuário (Stripe + Drizzle)
  useEffect(() => {
    if (isClerkLoaded) {
      if (isSignedIn) {
        setIsStatusLoading(true);
        fetch("/api/user/status")
          .then((res) => res.json())
          .then((data) => {
            setUserStatus(data);
            setIsStatusLoading(false);
          })
          .catch(() => {
            setUserStatus({ isPro: false, role: "subscriber" });
            setIsStatusLoading(false);
          });
      } else {
        setUserStatus(null);
        setIsStatusLoading(false);
      }
    }
  }, [isSignedIn, isClerkLoaded]);

  // Auxiliar para obter ícones de forma tipada e segura
  const renderIcon = (iconName: string) => {
    const iconClass = "h-5 w-5 text-emerald-800 shrink-0";
    switch (iconName) {
      case "Sprout": return <Sprout className={iconClass} />;
      case "Settings": return <Settings className={iconClass} />;
      case "Wheat": return <Wheat className={iconClass} />;
      case "Scale": return <Scale className={iconClass} />;
      case "Warehouse": return <Warehouse className={iconClass} />;
      case "Dna": return <Dna className={iconClass} />;
      case "TrendingUp": return <TrendingUp className={iconClass} />;
      case "Calendar": return <Calendar className={iconClass} />;
      case "Coins": return <Coins className={iconClass} />;
      case "PiggyBank": return <PiggyBank className={iconClass} />;
      case "Leaf": return <Leaf className={iconClass} />;
      default: return <Settings className={iconClass} />;
    }
  };

  const isUserPro = userStatus?.isPro === true;

  // Filtros aplicados
  const filteredCalculadoras = calculadoras.filter((calc) => {
    const matchesSearch = 
      calc.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      calc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calc.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "Todas" || calc.categoria === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ["Todas", "Agricultura", "Pecuária", "Financeiro"];

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900 selection:bg-emerald-200">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-emerald-950 text-white relative overflow-hidden py-16">
          <div className="absolute inset-0 -z-15 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-5" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Central de <span className="text-emerald-400">Calculadoras</span>
            </h1>
            <p className="text-emerald-100/80 text-sm sm:text-base max-w-2xl mx-auto">
              Decisões mais assertivas e econômicas direto no campo. Escolha uma das ferramentas abaixo para iniciar seus laudos agronômicos de alta precisão.
            </p>
          </div>
        </section>

        {/* Filtros e Busca */}
        <section className="py-8 bg-white border-b border-neutral-200 sticky top-20 z-40 shadow-xs">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Abas de Categorias */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 rounded-xl w-full md:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      selectedCategory === cat
                        ? "bg-white text-emerald-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Input de Busca */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Pesquisar calculadora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-neutral-50 border border-neutral-250 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 transition-all text-neutral-800"
                />
              </div>

            </div>
          </div>
        </section>

        {/* Listagem de Calculadoras */}
        <section className="py-12">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            {filteredCalculadoras.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200 shadow-xs max-w-md mx-auto p-6 space-y-4">
                <Search className="h-10 w-10 text-neutral-350 mx-auto" />
                <h3 className="font-bold text-lg text-neutral-800">Nenhuma ferramenta encontrada</h3>
                <p className="text-xs text-neutral-500">Tente buscar usando termos alternativos ou verifique a categoria selecionada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCalculadoras.map((calc) => {
                  const isProCalc = calc.plano === "Pro";
                  
                  // Permissão de acesso a esta ferramenta:
                  // Se não estiver logado: bloqueia tudo (exige login)
                  // Se estiver logado: se for Pro, permite tudo. Se for Free, permite só as Free
                  const hasAccess = isSignedIn && (!isProCalc || isUserPro);

                  return (
                    <div 
                      key={calc.slug}
                      className={`flex flex-col justify-between bg-white border rounded-3xl p-6 shadow-2xs hover:shadow-lg transition-all duration-300 relative group overflow-hidden ${
                        !hasAccess 
                          ? "border-neutral-200 bg-neutral-50/50" 
                          : "border-neutral-200 hover:border-emerald-700/30"
                      }`}
                    >
                      {/* Selo do Plano */}
                      <div className="absolute top-4 right-4">
                        {isProCalc ? (
                          <span className={`inline-flex items-center gap-1 text-[9.5px] font-extrabold px-2.5 py-1 rounded-full border ${
                            isUserPro
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-850 border-amber-250/60"
                          }`}>
                            <Lock className="h-2.5 w-2.5" />
                            Plano Pro
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9.5px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-850 border border-emerald-250/30">
                            Gratuito
                          </span>
                        )}
                      </div>

                      {/* Conteúdo Principal */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-50/80 rounded-2xl group-hover:scale-105 transition-transform duration-200">
                            {renderIcon(calc.iconName)}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                              {calc.categoria}
                            </span>
                            <h3 className="font-extrabold text-neutral-900 leading-snug text-sm group-hover:text-emerald-950 transition-colors">
                              {calc.nome}
                            </h3>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">
                          {calc.descricao}
                        </p>
                      </div>

                      {/* Ações */}
                      <div className="mt-6 pt-5 border-t border-neutral-100">
                        {!isSignedIn ? (
                          <SignInButton mode="modal">
                            <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl text-neutral-700 font-bold text-xs shadow-3xs transition-all cursor-pointer">
                              Entrar para Acessar
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </SignInButton>
                        ) : hasAccess ? (
                          <Link
                            href={`/ferramentas/${calc.slug}`}
                            className="w-full flex items-center justify-center gap-1 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all"
                          >
                            Acessar Calculadora
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href="/#planos"
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition-all"
                          >
                            Liberar no Plano Pro
                            <Lock className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
