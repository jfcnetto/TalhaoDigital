"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface PricingGridProps {
  plans: any[];
}

export default function PricingGrid({ plans }: PricingGridProps) {
  const { isSignedIn } = useUser();
  const [selectedInterval, setSelectedInterval] = useState<"month" | "quarter" | "semester">("month");
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<{ isPro: boolean } | null>(null);

  // Verifica se o usuário logado possui plano Pro ativo
  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/user/status")
        .then((res) => res.json())
        .then((data) => setUserStatus(data))
        .catch(() => setUserStatus({ isPro: false }));
    }
  }, [isSignedIn]);

  // Se o usuário for comprovadamente assinante Pro / Admin / Cortesia (isPro === true), oculta a seção de planos
  // Se for visitante anônimo ou usuário do Plano Gratuito, a tabela de planos aparece normalmente!
  if (userStatus?.isPro === true) {
    return null;
  }

  // Fallback de planos caso a lista de planos esteja vazia
  const mockPlans = [
    {
      id: "price_mock_mensal",
      name: "Plano Mensal Pro",
      amount: 3990,
      badge: null,
      monthlyEquivalent: "39,90",
      features: [
        "Todas as 19 calculadoras agronômicas",
        "Geração ilimitada de Laudos em PDF",
        "Impressão limpa formatada",
        "Armazenamento de relatórios no banco",
        "Suporte prioritário"
      ]
    },
    {
      id: "price_mock_trimestral",
      name: "Plano Trimestral Pro",
      amount: 11370,
      badge: "5% OFF",
      monthlyEquivalent: "37,90",
      features: [
        "Todas as 19 calculadoras agronômicas",
        "Geração ilimitada de Laudos em PDF",
        "Economia de R$ 6,00 por ciclo",
        "Armazenamento de relatórios no banco",
        "Suporte prioritário"
      ]
    },
    {
      id: "price_mock_semestral",
      name: "Plano Semestral Pro",
      amount: 21540,
      badge: "10% OFF",
      monthlyEquivalent: "35,90",
      features: [
        "Todas as 19 calculadoras agronômicas",
        "Geração ilimitada de Laudos em PDF",
        "Maior economia: R$ 24,00 por ciclo",
        "Armazenamento de relatórios no banco",
        "Suporte prioritário VIP"
      ]
    }
  ];

  const rawPlans = plans.length > 0 ? plans : mockPlans;

  // Ordena os planos por valor crescente para identificar corretamente Mensal (menor), Trimestral (médio) e Semestral (maior)
  const sortedPlans = [...rawPlans].sort((a, b) => a.amount - b.amount);

  // Seleciona o plano atual baseado na aba clicada
  let activePlan = sortedPlans[0]; // Padrão: Mensal (menor valor)
  if (selectedInterval === "quarter" && sortedPlans.length > 1) {
    activePlan = sortedPlans[1]; // Trimestral (valor intermediário)
  } else if (selectedInterval === "semester") {
    activePlan = sortedPlans[2] || sortedPlans[sortedPlans.length - 1]; // Semestral (maior valor)
  }

  // Ajusta badges e equivalentes de forma segura
  const getBadge = () => {
    if (selectedInterval === "quarter") return "5% OFF";
    if (selectedInterval === "semester") return "10% OFF";
    return null;
  };

  const getMonthlyEquivalent = () => {
    if (selectedInterval === "quarter") return "37,90";
    if (selectedInterval === "semester") return "35,90";
    return "39,90";
  };

  // Iniciar checkout direto no Stripe se o usuário estiver logado
  const handleCheckout = async (priceId: string) => {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }

    setLoadingPriceId(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erro ao iniciar checkout");
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      alert("Falha de conexão com o servidor de pagamento.");
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      
      {/* Título e Subtítulo da Seção de Planos */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          Planos Feitos para a sua <span className="text-emerald-800">Produtividade</span>
        </h2>
        <p className="text-neutral-500 text-sm sm:text-base leading-relaxed">
          Escolha o plano e o ciclo ideal para as suas necessidades. Cancele quando quiser.
        </p>
      </div>

      {/* Selector de Ciclo (Mensal | Trimestral | Semestral) */}
      <div className="flex justify-center">
        <div className="bg-neutral-200/60 p-1.5 rounded-2xl flex items-center gap-1 border border-neutral-200">
          <button
            type="button"
            onClick={() => setSelectedInterval("month")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              selectedInterval === "month"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Mensal
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedInterval("quarter")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedInterval === "quarter"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Trimestral
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
              5% OFF
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedInterval("semester")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedInterval === "semester"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Semestral
            <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
              10% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Cards de Comparação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
        
        {/* Card 1: Plano Essencial (Grátis) */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
          <div className="space-y-6">
            <div>
              <h3 className="font-extrabold text-xl text-neutral-850">Plano Essencial</h3>
              <p className="text-neutral-400 text-xs mt-2">Ferramentas básicas para uso rápido sem custos.</p>
            </div>

            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-neutral-900">R$ 0</span>
              <span className="text-neutral-400 text-sm font-semibold ml-1">/mês</span>
            </div>

            <ul className="space-y-3.5 text-xs text-neutral-600">
              <li className="flex gap-2">
                <Sparkles className="h-4 w-4 text-emerald-850 shrink-0" />
                <span>Acesso completo ao Blog Técnico</span>
              </li>
              <li className="flex gap-2">
                <Sparkles className="h-4 w-4 text-emerald-850 shrink-0" />
                <span>Memória de cálculo agronômico aberta</span>
              </li>
              <li className="flex flex-col gap-1.5 pt-2.5 border-t border-neutral-150">
                <span className="font-bold text-neutral-700">5 Calculadoras Gratuitas:</span>
                <ul className="pl-4 space-y-1 text-[11px] text-neutral-500 list-disc">
                  <li>Quebra de Umidade de Grãos</li>
                  <li>Calibrador de Bicos de Pulverização</li>
                  <li>Rendimento Operacional de Tratores</li>
                  <li>Conversor de Unidades de Nicho</li>
                  <li>Idade Gestacional e Alerta de Manejo</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Link
              href="/sign-up"
              className="w-full inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>

        {/* Card 2: Plano Pro Selecionado (Destaque) */}
        <div className="bg-emerald-950 text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900 rounded-full blur-2xl opacity-40 -mr-8 -mt-8" />

          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-xl text-white">Plano Pro</h3>
                <p className="text-emerald-300 text-xs mt-1">Acesso Pro irrestrito para emissão de laudos de precisão.</p>
              </div>
              {getBadge() && (
                <span className="bg-amber-400 text-amber-950 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm">
                  {getBadge()}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold tracking-tight">
                  {(activePlan.amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(",00", "")}
                </span>
                <span className="text-emerald-400 text-xs font-semibold ml-1.5">
                  / {selectedInterval === "month" ? "mês" : selectedInterval === "quarter" ? "a cada 3 meses" : "a cada 6 meses"}
                </span>
              </div>
              <span className="text-[11px] text-emerald-300 block font-medium">
                (Equivale a apenas R$ {getMonthlyEquivalent()} por mês)
              </span>
            </div>

            <ul className="space-y-3 text-xs text-emerald-100">
              <li className="flex gap-2 items-center">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Todas as 19 calculadoras agronômicas</span>
              </li>
              <li className="flex gap-2 items-center">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Geração ilimitada de Laudos em PDF</span>
              </li>
              <li className="flex gap-2 items-center">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Impressão limpa formatada</span>
              </li>
              <li className="flex gap-2 items-center">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Armazenamento de relatórios salvos no banco</span>
              </li>
              <li className="flex gap-2 items-center">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Suporte técnico prioritário de especialistas</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 relative z-10">
            <button
              onClick={() => handleCheckout(activePlan.id)}
              disabled={loadingPriceId !== null}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-xs font-extrabold text-emerald-950 hover:bg-emerald-50 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {loadingPriceId === activePlan.id ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin text-emerald-950" />
              ) : (
                "Assinar Plano Pro Agora"
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
