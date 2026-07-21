"use client";

import { useState, useEffect } from "react";
import { FileText, ArrowRight, Sparkles, Calendar, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface DashboardClientProps {
  isPro: boolean;
  proType: 'stripe' | 'courtesy' | 'admin' | 'none';
  plans: any[];
  reports: any[];
  subscription: any;
}

export default function DashboardClient({ isPro, proType, plans, reports, subscription }: DashboardClientProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<"month" | "quarter" | "semester">("month");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Verificar se acabou de retornar de um pagamento do Stripe
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "success") {
        setShowSuccessToast(true);
      }
    }
  }, []);

  // Iniciar sessão de Checkout do Stripe
  const handleSubscribe = async (priceId: string) => {
    setLoadingPlan(priceId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao iniciar o pagamento");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  // Fallback dinamico de planos
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
        "Armazenamento no banco",
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
        "Armazenamento no banco",
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
        "Armazenamento no banco",
        "Suporte prioritário VIP"
      ]
    }
  ];

  const rawPlans = plans.length > 0 ? plans : mockPlans;
  const sortedPlans = [...rawPlans].sort((a, b) => a.amount - b.amount);

  let activePlan = sortedPlans[0];
  if (selectedInterval === "quarter" && sortedPlans.length > 1) {
    activePlan = sortedPlans[1];
  } else if (selectedInterval === "semester") {
    activePlan = sortedPlans[2] || sortedPlans[sortedPlans.length - 1];
  }

  const getMonthlyEquivalent = () => {
    if (selectedInterval === "quarter") return "37,90";
    if (selectedInterval === "semester") return "35,90";
    return "39,90";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Coluna Principal: Histórico de Relatórios (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {showSuccessToast && (
          <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between gap-4 border border-emerald-700 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-800 rounded-xl">
                <Sparkles className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">Parabéns! Assinatura Pro Ativada! 🎉</h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Seu pagamento foi confirmado com sucesso pelo Stripe. Agora você tem acesso irrestrito a todas as calculadoras e emissão de laudos em PDF!
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowSuccessToast(false)}
              className="text-xs font-bold bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-600 transition-colors shrink-0 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 text-red-650 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
            <h2 className="font-bold text-neutral-850 text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-800" />
              Meus Laudos & Histórico
            </h2>
            <Link 
              href="/ferramentas/quebra-umidade"
              className="text-xs font-bold text-emerald-850 hover:text-emerald-950 inline-flex items-center gap-1 group"
            >
              Novo Cálculo
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {reports.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {reports.map((report) => (
                <div key={report.id} className="py-4 flex justify-between items-center gap-4">
                  <div>
                    <span className="font-bold text-sm text-neutral-800 block">
                      {report.toolId === 'quebra-umidade' ? 'Quebra de Umidade' : report.toolId}
                    </span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      {new Date(report.createdAt).toLocaleDateString("pt-BR")} - Área: {report.area}
                    </span>
                  </div>
                  <button className="text-xs border border-neutral-200 rounded-lg px-3 py-1.5 font-bold hover:bg-neutral-50 transition-colors">
                    Ver Laudo
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="font-bold text-neutral-800 text-sm block">Nenhum laudo gerado ainda</span>
                <span className="text-neutral-500 text-xs mt-1 block">Seus cálculos salvos aparecerão aqui. Comece pela calculadora grátis!</span>
              </div>
              <Link 
                href="/ferramentas/quebra-umidade"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 shadow transition-colors"
              >
                Acessar Calculadora
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Coluna Lateral: Informações do Plano (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-850" />
            Vigência do Plano
          </h3>

          {isPro ? (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Plano Técnico:</span>
                  <span className="font-bold text-emerald-800 uppercase">Talhão Pro</span>
                </div>
                
                {subscription && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Início da Vigência:</span>
                      <span className="font-bold text-neutral-700">
                        {new Date(subscription.currentPeriodStart).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Vence/Renova em:</span>
                      <span className="font-bold text-neutral-700">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </>
                )}

                {proType === 'courtesy' && (
                  <div className="pt-2 border-t border-emerald-100 text-center">
                    <span className="text-emerald-850 font-bold block">Acesso Cortesia Ativo</span>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">Validade vitalícia liberada pelo administrador</span>
                  </div>
                )}
                {proType === 'admin' && (
                  <div className="pt-2 border-t border-emerald-100 text-center">
                    <span className="text-emerald-850 font-bold block">Perfil Administrador</span>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">Acesso irrestrito ao sistema</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-center space-y-2">
                <span className="font-bold text-xs text-neutral-700 block">Plano Gratuito</span>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Você possui acesso apenas às ferramentas gratuitas. Faça o upgrade para liberar o laudo técnico completo e recursos Pro.
                </p>
              </div>

              {/* Seletor Dinâmico de Ciclos dentro do Painel do Usuário */}
              <div className="flex justify-center bg-neutral-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedInterval("month")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    selectedInterval === "month" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInterval("quarter")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    selectedInterval === "quarter" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
                  }`}
                >
                  3 Meses (-5%)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInterval("semester")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    selectedInterval === "semester" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
                  }`}
                >
                  6 Meses (-10%)
                </button>
              </div>

              {/* Card Dinâmico Conectado ao Stripe */}
              <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50/50 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-extrabold text-xs text-neutral-850">{activePlan.name || "Plano Pro"}</span>
                  <span className="text-xs font-bold text-emerald-800">
                    {(activePlan.amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>

                <span className="text-[10px] text-emerald-700 block font-medium">
                  (Equivale a R$ {getMonthlyEquivalent()}/mês)
                </span>

                <ul className="text-[10.5px] text-neutral-600 space-y-1.5">
                  <li className="flex gap-1.5 items-start">
                    <Sparkles className="h-3 w-3 text-emerald-700 mt-0.5 shrink-0" />
                    <span>Todas as 19 calculadoras agronômicas</span>
                  </li>
                  <li className="flex gap-1.5 items-start">
                    <Sparkles className="h-3 w-3 text-emerald-700 mt-0.5 shrink-0" />
                    <span>Geração ilimitada de Laudos em PDF</span>
                  </li>
                  <li className="flex gap-1.5 items-start">
                    <Sparkles className="h-3 w-3 text-emerald-700 mt-0.5 shrink-0" />
                    <span>Armazenamento de relatórios salvos</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleSubscribe(activePlan.id)}
                  disabled={loadingPlan !== null}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-3 shadow transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loadingPlan === activePlan.id ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                  ) : (
                    "Assinar Plano Pro Agora"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
