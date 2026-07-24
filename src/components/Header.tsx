"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { ChevronDown, Wheat, Sprout, Settings, ShieldCheck, BookOpen, Warehouse, Scale, Dna, TrendingUp, Calendar, Coins, PiggyBank, Leaf, Lock } from "lucide-react";
import { calculadoras } from "@/lib/calculadoras";

const iconsMap: Record<string, React.ComponentType<any>> = {
  Sprout,
  Settings,
  Wheat,
  Scale,
  Warehouse,
  Dna,
  TrendingUp,
  Calendar,
  Coins,
  PiggyBank,
  Leaf,
};

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<{ isPro: boolean; role: string } | null>(null);
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/user/status")
        .then((res) => res.json())
        .then((data) => setUserStatus(data))
        .catch(() => setUserStatus({ isPro: false, role: 'subscriber' }));
    }
  }, [isSignedIn]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center group">
          <img 
            src="/logo.svg" 
            alt="Talhão Digital" 
            className="h-12 w-auto object-contain group-hover:scale-[1.02] transition-transform duration-200" 
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          <Link href="/" className="hover:text-emerald-800 transition-colors py-2">Início</Link>

          {/* Dropdown de Calculadoras */}
          <div 
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button 
              className="flex items-center gap-1 hover:text-emerald-800 transition-colors focus:outline-none py-2 cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Calculadoras
              <ChevronDown className="h-4 w-4" />
            </button>

             {/* Menu Dropdown Multicolunas Organizado */}
             {dropdownOpen && (
               <div className="absolute left-1/2 -translate-x-1/2 mt-0 w-[780px] rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-3 gap-6">
                    
                    {/* Categoria 1: Agricultura */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block px-2 pb-1 border-b border-neutral-100">
                        Agricultura
                      </span>
                      
                      {calculadoras
                        .filter((c) => c.categoria === "Agricultura")
                        .map((calc) => {
                          const isProCalc = calc.plano === "Pro";
                          const hasAccess = isSignedIn && (!isProCalc || userStatus?.isPro === true);
                          const IconComponent = iconsMap[calc.iconName] || Settings;

                          return (
                            <Link 
                              key={calc.slug}
                              href={hasAccess ? `/ferramentas/${calc.slug}` : "#"}
                              className={`flex items-start justify-between gap-2.5 p-2 rounded-xl transition-colors group relative ${
                                hasAccess 
                                  ? "hover:bg-emerald-50/50" 
                                  : "opacity-40 cursor-not-allowed select-none pointer-events-none"
                              }`}
                              onClick={(e) => {
                                if (!hasAccess) {
                                  e.preventDefault();
                                  return;
                                }
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                                  <IconComponent className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold text-[11px] text-neutral-850 block">{calc.nome}</span>
                                  <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">{calc.descricaoCurta}</span>
                                </div>
                              </div>
                              {!hasAccess && (
                                <Lock className="h-3 w-3 text-neutral-400 shrink-0 mt-1 self-start" />
                              )}
                            </Link>
                          );
                        })}
                    </div>

                    {/* Categoria 2: Pecuária */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block px-2 pb-1 border-b border-neutral-100">
                        Pecuária
                      </span>

                      {calculadoras
                        .filter((c) => c.categoria === "Pecuária")
                        .map((calc) => {
                          const isProCalc = calc.plano === "Pro";
                          const hasAccess = isSignedIn && (!isProCalc || userStatus?.isPro === true);
                          const IconComponent = iconsMap[calc.iconName] || Settings;

                          return (
                            <Link 
                              key={calc.slug}
                              href={hasAccess ? `/ferramentas/${calc.slug}` : "#"}
                              className={`flex items-start justify-between gap-2.5 p-2 rounded-xl transition-colors group relative ${
                                hasAccess 
                                  ? "hover:bg-emerald-50/50" 
                                  : "opacity-40 cursor-not-allowed select-none pointer-events-none"
                              }`}
                              onClick={(e) => {
                                if (!hasAccess) {
                                  e.preventDefault();
                                  return;
                                }
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                                  <IconComponent className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold text-[11px] text-neutral-850 block">{calc.nome}</span>
                                  <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">{calc.descricaoCurta}</span>
                                </div>
                              </div>
                              {!hasAccess && (
                                <Lock className="h-3 w-3 text-neutral-400 shrink-0 mt-1 self-start" />
                              )}
                            </Link>
                          );
                        })}
                    </div>

                    {/* Categoria 3: Gestão Financeira */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block px-2 pb-1 border-b border-neutral-100">
                        Gestão Financeira
                      </span>

                      {calculadoras
                        .filter((c) => c.categoria === "Financeiro")
                        .map((calc) => {
                          const isProCalc = calc.plano === "Pro";
                          const hasAccess = isSignedIn && (!isProCalc || userStatus?.isPro === true);
                          const IconComponent = iconsMap[calc.iconName] || Settings;

                          return (
                            <Link 
                              key={calc.slug}
                              href={hasAccess ? `/ferramentas/${calc.slug}` : "#"}
                              className={`flex items-start justify-between gap-2.5 p-2 rounded-xl transition-colors group relative ${
                                hasAccess 
                                  ? "hover:bg-emerald-50/50" 
                                  : "opacity-40 cursor-not-allowed select-none pointer-events-none"
                              }`}
                              onClick={(e) => {
                                if (!hasAccess) {
                                  e.preventDefault();
                                  return;
                                }
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                                  <IconComponent className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold text-[11px] text-neutral-850 block">{calc.nome}</span>
                                  <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">{calc.descricaoCurta}</span>
                                </div>
                              </div>
                              {!hasAccess && (
                                <Lock className="h-3 w-3 text-neutral-400 shrink-0 mt-1 self-start" />
                              )}
                            </Link>
                          );
                        })}
                    </div>
                  </div>
               </div>
             )}
          </div>

          <Link href="/ajuda" className="hover:text-emerald-800 transition-colors py-2">Ajuda</Link>
          <Link href="/blog" className="hover:text-emerald-800 transition-colors py-2">Blog</Link>
          {userStatus?.isPro !== true && (
            <Link href="/#planos" className="hover:text-emerald-800 transition-colors py-2">Planos</Link>
          )}
          <Link href="/contato" className="hover:text-emerald-800 transition-colors py-2">Contato</Link>
        </nav>

        <div className="flex items-center gap-4">
          <SignedIn>
            {/* Bloco do Avatar com o Badge Verdinho do Plano Pro centralizado diretamente abaixo dele */}
            <div className="flex flex-col items-center justify-center gap-1">
              <UserButton afterSignOutUrl="/">
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Painel Administrativo"
                    labelIcon={<ShieldCheck className="h-4 w-4 text-emerald-800" />}
                    href="/admin"
                  />
                  <UserButton.Link
                    label="Configurações de Perfil"
                    labelIcon={<Settings className="h-4 w-4 text-emerald-800" />}
                    href="/dashboard/perfil"
                  />
                  <UserButton.Link
                    label="Gerenciamento do Blog"
                    labelIcon={<BookOpen className="h-4 w-4 text-emerald-800" />}
                    href="/admin/blog"
                  />
                </UserButton.MenuItems>
              </UserButton>

              {/* Status verdinho posicionado e centralizado exatamente abaixo do avatar */}
              {userStatus && (
                <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap text-center ${
                  userStatus.isPro 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  {userStatus.isPro ? "🟢 Pro Ativo" : "🟡 Grátis"}
                </span>
              )}
            </div>
          </SignedIn>
          
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-neutral-600 hover:text-emerald-800 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-950 hover:shadow transition-all duration-200"
            >
              Testar Grátis
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
