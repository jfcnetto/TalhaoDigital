"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { ChevronDown, Wheat, Sprout, Settings, ShieldCheck, BookOpen, Warehouse, Scale, Dna, TrendingUp, Calendar } from "lucide-react";

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
                 <div className="grid grid-cols-4 gap-6">
                   
                   {/* Categoria 1: Solo & Nutrição */}
                   <div className="space-y-2">
                     <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block px-2 pb-1 border-b border-neutral-100">
                       Solo & Nutrição
                     </span>
                     
                     <Link 
                       href="/ferramentas/calagem-gessagem"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Sprout className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Calagem e Gessagem</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Saturação por bases V%</span>
                       </div>
                     </Link>

                     <Link 
                       href="/ferramentas/balanceador-npk"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Settings className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Balanceador NPK</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Mistura de formulações</span>
                       </div>
                     </Link>
                   </div>

                   {/* Categoria 2: Tecnologia de Aplicação */}
                   <div className="space-y-2">
                     <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block px-2 pb-1 border-b border-neutral-100">
                       Pulverização
                     </span>

                     <Link 
                       href="/ferramentas/calibrador-bicos"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Settings className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Calibração de Bicos</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Vazão real (L/min)</span>
                       </div>
                     </Link>

                     <Link 
                       href="/ferramentas/mistura-tanque"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Settings className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Mistura de Tanque</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Ordem e compatibilidade</span>
                       </div>
                     </Link>
                   </div>

                   {/* Categoria 3: Operações & Grãos */}
                   <div className="space-y-2">
                     <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block px-2 pb-1 border-b border-neutral-100">
                       Operações & Grãos
                     </span>

                     <Link 
                       href="/ferramentas/quebra-umidade"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Wheat className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Quebra de Umidade</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Desconto comercial</span>
                       </div>
                     </Link>

                     <Link 
                       href="/ferramentas/rendimento-trator"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Settings className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Rendimento de Trator</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Campo e tempo (ha/h)</span>
                       </div>
                     </Link>

                     <Link 
                       href="/ferramentas/depreciacao-maquinas"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Settings className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Depreciação de Máquinas</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Custo horário e linear</span>
                       </div>
                     </Link>

                     <Link 
                       href="/ferramentas/perda-colheita"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Wheat className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Perda na Colheita</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Amostragem Soja/Milho</span>
                       </div>
                     </Link>

                     <Link 
                       href="/ferramentas/ponto-equilibrio"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Scale className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Ponto de Equilíbrio</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Margem por ha e sacas/ha</span>
                       </div>
                     </Link>
                   </div>

                    {/* Categoria 4: Pecuária & Silagem */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block px-2 pb-1 border-b border-neutral-100">
                        Pecuária & Silagem
                      </span>

                      <Link 
                        href="/ferramentas/volume-silo"
                        className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                          <Warehouse className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-[11px] text-neutral-850 block">Volume de Silo</span>
                          <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Trincheira, Encosto e Bolsa</span>
                        </div>
                      </Link>

                      <Link 
                        href="/ferramentas/quadrado-pearson"
                        className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                          <Dna className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-[11px] text-neutral-850 block">Balanceador (Pearson)</span>
                          <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">% Proteína Bruta da Ração</span>
                        </div>
                      </Link>

                      <Link 
                        href="/ferramentas/suporte-pastagem"
                        className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                          <Sprout className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-[11px] text-neutral-850 block">Suporte de Pastagem</span>
                          <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Capacidade de Lotação (UA/ha)</span>
                        </div>
                      </Link>

                      <Link 
                        href="/ferramentas/rendimento-carcaca"
                        className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-[11px] text-neutral-850 block">Rendimento de Carcaça</span>
                          <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Peso da Carcaça e Valor da Arroba (@)</span>
                        </div>
                      </Link>

                      <Link 
                        href="/ferramentas/gestacao-vacas"
                        className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                          <Calendar className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-[11px] text-neutral-850 block">Gestão Gestacional Vacas</span>
                          <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Previsão de Parto e Secagem</span>
                        </div>
                      </Link>
                    </div>

                    {/* Categoria 5: Agricultura de Precisão */}
                   <div className="space-y-2">
                     <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block px-2 pb-1 border-b border-neutral-100">
                       Precisão & Mapas
                     </span>

                     <Link 
                       href="/ferramentas/conversor-gps"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Settings className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Conversor de GPS</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">KML/GPX para Shapefile</span>
                       </div>
                     </Link>

                     <Link 
                       href="/ferramentas/conversor-unidades"
                       className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/50 transition-colors group"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <div className="p-1.5 bg-emerald-50 text-emerald-850 rounded-lg group-hover:bg-emerald-100/70 transition-colors shrink-0">
                         <Scale className="h-3.5 w-3.5" />
                       </div>
                       <div>
                         <span className="font-bold text-[11px] text-neutral-850 block">Conversor de Unidades</span>
                         <span className="text-[9.5px] text-neutral-500 block mt-0.5 leading-snug">Alqueires, Bushels e Pesos</span>
                       </div>
                     </Link>
                   </div>
                 </div>
               </div>
             )}
          </div>

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
