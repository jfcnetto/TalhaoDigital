"use client";

import { useState, useEffect } from "react";
import { 
  Users, Shield, Award, CreditCard, RefreshCw, 
  CheckCircle, XCircle, AlertTriangle, Loader2, 
  TrendingUp, DollarSign, ExternalLink, Mail, ArrowUpRight,
  Settings, Key, Eye, EyeOff
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminClientProps {
  initialUsers: any[];
  subscriptions: any[];
  plans: any[];
  initialRecoveryLogs: any[];
  initialSmtpConfig?: {
    host: string;
    port: string;
    user: string;
    pass: string;
    fromEmail: string;
    secure: boolean;
  } | null;
}

export default function AdminClient({ 
  initialUsers, 
  subscriptions, 
  plans, 
  initialRecoveryLogs,
  initialSmtpConfig
}: AdminClientProps) {
  const router = useRouter();
  const [usersList, setUsersList] = useState(initialUsers);
  const [recoveryLogs, setRecoveryLogs] = useState(initialRecoveryLogs);
  
  const [activeTab, setActiveTab] = useState<"users" | "finance" | "settings">("users");
  const [syncLoading, setSyncLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Configurações SMTP
  const [smtpHost, setSmtpHost] = useState(initialSmtpConfig?.host || "");
  const [smtpPort, setSmtpPort] = useState(initialSmtpConfig?.port || "587");
  const [smtpUser, setSmtpUser] = useState(initialSmtpConfig?.user || "");
  const [smtpPass, setSmtpPass] = useState(initialSmtpConfig?.pass || "");
  const [smtpFrom, setSmtpFrom] = useState(initialSmtpConfig?.fromEmail || "");
  const [smtpSecure, setSmtpSecure] = useState(initialSmtpConfig?.secure || false);
  const [showPass, setShowPass] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // Simulador de CAC
  const [marketingSpend, setMarketingSpend] = useState<number>(500);

  // Sincronizar logs vindos de props
  useEffect(() => {
    setUsersList(initialUsers);
    setRecoveryLogs(initialRecoveryLogs);
  }, [initialUsers, initialRecoveryLogs]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          fromEmail: smtpFrom,
          secure: smtpSecure,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações");
      setStatusMessage({ type: "success", text: data.message });
      alert(data.message);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      alert(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/settings/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          fromEmail: smtpFrom,
          secure: smtpSecure,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao testar SMTP");
      setStatusMessage({ type: "success", text: data.message });
      alert(data.message);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      alert(err.message);
    } finally {
      setTestLoading(false);
    }
  };

  // Sincronizar planos do Stripe
  const handleSyncPlans = async () => {
    setSyncLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/stripe/sync-plans");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao sincronizar");
      setStatusMessage({ type: "success", text: data.message });
      router.refresh();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setSyncLoading(false);
    }
  };

  // Alternar Cargo ou Cortesia do Usuário
  const handleUserAction = async (targetUserId: string, action: "toggle-courtesy" | "toggle-role") => {
    setActionLoading(`${targetUserId}-${action}`);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar ação");

      // Atualiza a listagem de usuários localmente
      setUsersList((prev) => 
        prev.map((user) => {
          if (user.id === targetUserId) {
            if (action === "toggle-courtesy") {
              return { ...user, isCourtesyPro: !user.isCourtesyPro };
            }
            if (action === "toggle-role") {
              return { ...user, role: user.role === "admin" ? "subscriber" : "admin" };
            }
          }
          return user;
        })
      );

      setStatusMessage({ type: "success", text: data.message });
      router.refresh();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Simular Cobrança / Inadimplência
  const handleSimulateRecovery = async (targetUserId: string) => {
    setActionLoading(`${targetUserId}-simulate-recovery`);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action: "simulate-recovery" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao simular recuperação");

      // Alerta visual de sucesso na tela
      alert(data.message);

      setStatusMessage({ 
        type: "success", 
        text: `${data.message} ${data.previewUrl ? `(Visualização Ethereal disponível na aba Financeiro)` : ""}` 
      });

      // Recarrega os logs de recuperação do servidor
      router.refresh();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Mapeia assinaturas por usuário
  const getSubForUser = (userId: string) => {
    return subscriptions.find((sub) => sub.userId === userId);
  };

  // --- CÁLCULO DE MÉTRICAS SAAS & FINANÇAS ---
  
  // Mapeador de plano para valor mensal equivalente
  const getMonthlyEquivalent = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return 0;
    
    const amt = plan.amount / 100;
    const name = (plan.name || "").toLowerCase();
    const interval = (plan.interval || "").toLowerCase();

    // 1. Checa por palavra-chave no nome
    if (name.includes("trimestral") || name.includes("3 meses")) {
      return amt / 3;
    }
    if (name.includes("semestral") || name.includes("6 meses")) {
      return amt / 6;
    }
    if (interval === "year" || name.includes("anual")) {
      return amt / 12;
    }

    // 2. Fallback de segurança pelo valor exato cadastrado (caso o nome do Stripe não contenha o termo)
    if (plan.amount === 11370) {
      return amt / 3; // Equivale a R$ 37,90/mês
    }
    if (plan.amount === 21540) {
      return amt / 6; // Equivale a R$ 35,90/mês
    }

    return amt; // Padrão mensal
  };

  // Assinaturas Ativas, Trialing, Past Due
  const activeSubs = subscriptions.filter(sub => sub.status === "active" || sub.status === "trialing");
  const pastDueSubs = subscriptions.filter(sub => sub.status === "past_due");
  const canceledSubs = subscriptions.filter(sub => sub.status === "canceled" || sub.status === "unpaid");
  
  // MRR & ARR
  const mrr = activeSubs.reduce((acc, sub) => acc + getMonthlyEquivalent(sub.planId), 0) + 
              pastDueSubs.reduce((acc, sub) => acc + getMonthlyEquivalent(sub.planId), 0);
  const arr = mrr * 12;

  // Churn Rate (Percentual de cancelados em relação ao total acumulado histórico)
  const totalHistoricalSubs = activeSubs.length + pastDueSubs.length + canceledSubs.length;
  const churnRate = totalHistoricalSubs > 0 ? (canceledSubs.length / totalHistoricalSubs) * 100 : 0;

  // ARPU (Average Revenue Per User)
  const activeUsersCount = activeSubs.length + pastDueSubs.length;
  const arpu = activeUsersCount > 0 ? mrr / activeUsersCount : 0;

  // LTV (Lifetime Value)
  const ltv = churnRate > 0 ? arpu / (churnRate / 100) : arpu * 24; // Padrão 24 meses se churn for zero

  // CAC (Customer Acquisition Cost)
  // Novos assinantes nos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newSubsLast30Days = subscriptions.filter(sub => {
    return (sub.status === "active" || sub.status === "trialing") && new Date(sub.createdAt) > thirtyDaysAgo;
  }).length;

  const simulatedCac = newSubsLast30Days > 0 ? marketingSpend / newSubsLast30Days : marketingSpend;
  const ltvToCacRatio = simulatedCac > 0 ? ltv / simulatedCac : 0;

  // --- SEPARAÇÃO GRÁFICA: FATURAMENTO VS CORTESIAS ---
  const courtesyCount = usersList.filter(u => u.isCourtesyPro).length;
  const standardMonthlyPrice = 39.90; // R$ 39,90/mês
  const courtesyMrrCost = courtesyCount * standardMonthlyPrice;

  // Proporções de Usuários para Gráfico Donut
  const paidCount = activeUsersCount;
  const freeCount = Math.max(0, usersList.length - paidCount - courtesyCount);
  const totalBase = usersList.length || 1;

  const paidPct = (paidCount / totalBase) * 100;
  const courtesyPct = (courtesyCount / totalBase) * 100;
  const freePct = (freeCount / totalBase) * 100;

  return (
    <div className="space-y-8">
      
      {/* Abas Administrativas */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "users"
              ? "border-emerald-800 text-emerald-800"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <Users className="h-4 w-4" />
          Usuários & Permissões
        </button>
        <button
          onClick={() => setActiveTab("finance")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "finance"
              ? "border-emerald-800 text-emerald-800"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Métricas SaaS & Finanças
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-emerald-800 text-emerald-800"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <Settings className="h-4 w-4" />
          Configurações SMTP
        </button>
      </div>

      {/* Mensagens de feedback */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 duration-200 ${
          statusMessage.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {statusMessage.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* ABA 1: GERENCIAMENTO DE USUÁRIOS */}
      {activeTab === "users" && (
        <div className="space-y-8">
          {/* Sincronizar Stripe */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-neutral-800 text-base">Catálogo de Planos do Stripe</h3>
              <p className="text-neutral-550 text-xs mt-1">
                Mantenha a tabela de planos local sincronizada com os preços e produtos do seu Stripe Dashboard.
              </p>
            </div>
            <button
              onClick={handleSyncPlans}
              disabled={syncLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-3 shadow transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {syncLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sincronizar Planos Stripe
            </button>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-800" />
              <h2 className="font-bold text-neutral-850 text-base">Gerenciamento de Usuários ({usersList.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Cargo (Role)</th>
                    <th className="p-4">Assinatura Stripe</th>
                    <th className="p-4">Acesso Cortesia</th>
                    <th className="p-4 text-right">Ações de Controle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {usersList.map((user) => {
                    const sub = getSubForUser(user.id);
                    const hasStripePro = sub?.status === "active" || sub?.status === "trialing";

                    return (
                      <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4 space-y-1">
                          <span className="font-bold text-neutral-800 block">{user.name || "Sem Nome"}</span>
                          <span className="text-neutral-500 block">{user.email}</span>
                          <span className="text-[10px] text-neutral-400 block">Cadastrado em: {new Date(user.createdAt).toLocaleDateString("pt-BR")}</span>
                        </td>
                        <td className="p-4">
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-100 text-red-700 font-bold text-[10px]">
                              <Shield className="h-3 w-3" />
                              Administrador
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-600 font-medium text-[10px]">
                              Produtor
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {hasStripePro ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-[10px]">
                                <CreditCard className="h-3 w-3" />
                                Pago (Ativo)
                              </span>
                              {sub.currentPeriodEnd && (
                                <span className="text-[10px] text-neutral-400 block">Validade: {new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")}</span>
                              )}
                            </div>
                          ) : sub ? (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                sub.status === "past_due" 
                                  ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse" 
                                  : "bg-neutral-100 border-neutral-200 text-neutral-500"
                              }`}>
                                {sub.status === "past_due" ? <AlertTriangle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                Stripe: {sub.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {user.isCourtesyPro ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-[10px]">
                              <Award className="h-3 w-3 text-emerald-600" />
                              Cortesia Pro Ativa
                            </span>
                          ) : (
                            <span className="text-neutral-400">Inativo</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2 space-y-1.5 md:space-y-0">
                          {!hasStripePro && (
                            <button
                              onClick={() => handleSimulateRecovery(user.id)}
                              disabled={actionLoading !== null}
                              className="inline-flex items-center justify-center font-bold px-3 py-1.5 rounded-lg border text-[10.5px] shadow-sm transition-all duration-150 active:scale-95 bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoading === `${user.id}-simulate-recovery` ? (
                                <Loader2 className="h-3 w-3 animate-spin text-amber-700" />
                              ) : (
                                <Mail className="h-3 w-3 mr-1" />
                              )}
                              Simular Cobrança
                            </button>
                          )}
                          <button
                            onClick={() => handleUserAction(user.id, "toggle-courtesy")}
                            disabled={actionLoading !== null}
                            className={`inline-flex items-center justify-center font-bold px-3 py-1.5 rounded-lg border text-[10.5px] shadow-sm transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 ${
                              user.isCourtesyPro 
                                ? "bg-white hover:bg-red-50 border-red-200 text-red-600"
                                : "bg-white hover:bg-emerald-50 border-neutral-200 text-emerald-800"
                            }`}
                          >
                            {actionLoading === `${user.id}-toggle-courtesy` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : user.isCourtesyPro ? (
                              "Remover Cortesia"
                            ) : (
                              "Dar Cortesia Pro"
                            )}
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, "toggle-role")}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center justify-center font-bold px-3 py-1.5 rounded-lg border text-[10.5px] shadow-sm transition-all duration-150 active:scale-95 bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === `${user.id}-toggle-role` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : user.role === "admin" ? (
                              "Tornar Produtor"
                            ) : (
                              "Tornar Admin"
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: MÉTRICAS FINANCEIRAS & SAAS */}
      {activeTab === "finance" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coluna da Esquerda: Métricas Principais & Logs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Cards de Métricas SaaS */}
            <div className="grid grid-cols-2 gap-4">
              
              <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <DollarSign className="h-16 w-16" />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-85 block">MRR (Mensal)</span>
                <span className="text-3xl font-extrabold block mt-1 tracking-tight">
                  {mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <div className="border-t border-emerald-900 pt-3 mt-4 flex justify-between text-[10px] opacity-75 font-semibold">
                  <span>Assinaturas Pagas:</span>
                  <span>{activeUsersCount}</span>
                </div>
              </div>

              <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <TrendingUp className="h-16 w-16" />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-85 block">ARR (Anual)</span>
                <span className="text-3xl font-extrabold block mt-1 tracking-tight">
                  {arr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <div className="border-t border-emerald-900 pt-3 mt-4 flex justify-between text-[10px] opacity-75 font-semibold">
                  <span>Ticket Médio (ARPU):</span>
                  <span>{arpu.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês</span>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <span className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase block">Churn Rate</span>
                <span className="text-3xl font-extrabold text-neutral-800 block mt-1 tracking-tight">
                  {churnRate.toFixed(1)}%
                </span>
                <p className="text-[9px] text-neutral-400 mt-2">
                  Proporção de cancelados ({canceledSubs.length}) no total histórico.
                </p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <span className="text-[10px] text-neutral-500 font-bold tracking-wider uppercase block">LTV (Lifetime Value)</span>
                <span className="text-3xl font-extrabold text-neutral-800 block mt-1 tracking-tight">
                  {ltv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <p className="text-[9px] text-neutral-400 mt-2">
                  {churnRate === 0 ? "Estimado em ciclo de 24 meses." : "Calculado com base na taxa de Churn."}
                </p>
              </div>

            </div>

            {/* Simulador Interativo de CAC */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-800" />
                  Calculadora de Relação LTV / CAC
                </h3>
                <p className="text-neutral-500 text-[10.5px] mt-0.5">
                  Simule a viabilidade econômica do seu SaaS ajustando o investimento mensal em aquisição.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-600 font-medium">Investimento Mensal de Marketing:</span>
                  <span className="font-bold text-neutral-800">
                    {marketingSpend.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={marketingSpend}
                  onChange={(e) => setMarketingSpend(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                />

                <div className="grid grid-cols-3 gap-2 border-t pt-3 border-neutral-100 text-center">
                  <div className="p-2 bg-neutral-55 rounded-lg">
                    <span className="text-[9px] text-neutral-450 uppercase block font-bold">Novos Clientes (30d)</span>
                    <span className="text-base font-extrabold text-neutral-700">{newSubsLast30Days}</span>
                  </div>
                  <div className="p-2 bg-neutral-55 rounded-lg">
                    <span className="text-[9px] text-neutral-450 uppercase block font-bold">CAC Simulado</span>
                    <span className="text-base font-extrabold text-neutral-700">
                      {simulatedCac.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="p-2 bg-neutral-55 rounded-lg">
                    <span className="text-[9px] text-neutral-450 uppercase block font-bold">Métrica LTV/CAC</span>
                    <span className={`text-base font-extrabold block ${
                      ltvToCacRatio >= 3 ? "text-emerald-700" : ltvToCacRatio >= 1 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {ltvToCacRatio.toFixed(1)}x
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border text-[10.5px] font-semibold text-center ${
                  ltvToCacRatio >= 3 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                    : ltvToCacRatio >= 1 
                    ? "bg-amber-50 border-amber-100 text-amber-800" 
                    : "bg-red-50 border-red-100 text-red-800"
                }`}>
                  {ltvToCacRatio >= 3 
                    ? "🟢 Excelente! O LTV é mais que 3 vezes o CAC. Sua aquisição está altamente saudável." 
                    : ltvToCacRatio >= 1 
                    ? "🟡 Atenção: Relação LTV/CAC intermediária. Busque reduzir o CAC ou aumentar a retenção." 
                    : "🔴 Alerta crítico: O CAC supera o LTV! Você está perdendo dinheiro para adquirir cada usuário."
                  }
                </div>
              </div>
            </div>

            {/* Logs de Recuperação de Inadimplência */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-100 flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-800" />
                <h3 className="font-bold text-neutral-850 text-sm">Histórico de Alertas de Cobrança ({recoveryLogs.length})</h3>
              </div>

              {recoveryLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                        <th className="p-3">Destinatário</th>
                        <th className="p-3">Tipo de Alerta</th>
                        <th className="p-3">Status / Envio</th>
                        <th className="p-3 text-right">Visualização</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {recoveryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="p-3 font-semibold text-neutral-800">{log.email}</td>
                          <td className="p-3">
                            <span className="capitalize">{log.type === 'manual_test' ? 'Simulação de Teste' : log.type.replace('_', ' ')}</span>
                          </td>
                          <td className="p-3 space-y-0.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              log.status === 'sent' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : log.status === 'simulated' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              {log.status === 'sent' ? 'Enviado' : log.status === 'simulated' ? 'Simulado (Log)' : 'Falhou'}
                            </span>
                            <span className="block text-[9px] text-neutral-400">
                              {new Date(log.sentAt).toLocaleString("pt-BR")}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {log.previewUrl ? (
                              <a
                                href={log.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                              >
                                Ver E-mail
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-neutral-450 italic text-[10px]">Sem preview</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Nenhum alerta de inadimplência disparado ou simulado ainda.
                </div>
              )}
            </div>

          </div>

          {/* Coluna da Direita: Painel de Gráficos (5 cols) */}
          <div className="lg:col-span-5 sticky top-6 space-y-6">
            
            {/* Card de Gráfico 1: Composição de Usuários (Donut SVG) */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-neutral-800 text-sm">Composição da Base de Usuários</h3>
                <p className="text-neutral-500 text-[10.5px] mt-0.5">Distribuição percentual de usuários cadastrados.</p>
              </div>

              <div className="flex items-center justify-between gap-4">
                {/* SVG Donut Segmentado com r=15.91549430918954 (Circumferência = 100) */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    {/* Background Ring */}
                    <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#f3f4f6" strokeWidth="4.2" />
                    
                    {/* Segment 1: Paid (Emerald) */}
                    {paidPct > 0 && (
                      <circle 
                        cx="18" cy="18" r="15.91549430918954" 
                        fill="transparent" 
                        stroke="#047857" 
                        strokeWidth="4.2" 
                        strokeDasharray={`${paidPct} ${100 - paidPct}`} 
                        strokeDashoffset="0" 
                        className="transform -rotate-90 origin-[18px_18px]"
                      />
                    )}
                    
                    {/* Segment 2: Courtesy (Amber) */}
                    {courtesyPct > 0 && (
                      <circle 
                        cx="18" cy="18" r="15.91549430918954" 
                        fill="transparent" 
                        stroke="#f59e0b" 
                        strokeWidth="4.2" 
                        strokeDasharray={`${courtesyPct} ${100 - courtesyPct}`} 
                        strokeDashoffset={-paidPct} 
                        className="transform -rotate-90 origin-[18px_18px]"
                      />
                    )}

                    {/* Segment 3: Free (Gray) */}
                    {freePct > 0 && (
                      <circle 
                        cx="18" cy="18" r="15.91549430918954" 
                        fill="transparent" 
                        stroke="#d1d5db" 
                        strokeWidth="4.2" 
                        strokeDasharray={`${freePct} ${100 - freePct}`} 
                        strokeDashoffset={-(paidPct + courtesyPct)} 
                        className="transform -rotate-90 origin-[18px_18px]"
                      />
                    )}

                    {/* Textos internos centralizados via coordenadas nativas do SVG */}
                    <text 
                      x="18" 
                      y="17.5" 
                      textAnchor="middle" 
                      fontWeight="900" 
                      fontSize="6.5" 
                      fill="#111827"
                      className="font-sans select-none"
                    >
                      {usersList.length}
                    </text>
                    <text 
                      x="18" 
                      y="23.5" 
                      textAnchor="middle" 
                      fontWeight="800" 
                      fontSize="2.2" 
                      fill="#6b7280"
                      className="font-sans select-none tracking-wider"
                    >
                      USUÁRIOS
                    </text>
                  </svg>
                </div>

                {/* Legendas Coloridas Alinhadas */}
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-700 shrink-0" />
                      <span className="text-neutral-600 font-medium">Pagantes (Stripe):</span>
                    </div>
                    <span className="font-extrabold text-neutral-800">{paidCount} ({paidPct.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-neutral-600 font-medium">Cortesias Pro:</span>
                    </div>
                    <span className="font-extrabold text-neutral-800">{courtesyCount} ({courtesyPct.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-gray-300 shrink-0" />
                      <span className="text-neutral-600 font-medium">Gratuitos (Free):</span>
                    </div>
                    <span className="font-extrabold text-neutral-800">{freeCount} ({freePct.toFixed(0)}%)</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Card de Gráfico 2: Faturamento Stripe vs Cortesias (Gráfico de Separação Gráfica Clara) */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-neutral-800 text-sm">Faturamento Real vs. Cortesias</h3>
                <p className="text-neutral-550 text-[10.5px] mt-0.5">
                  Separação entre a receita faturada e o valor concedido de forma cortesia.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Barra de Progresso Comparativo */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-emerald-800">Faturamento Stripe Real (MRR)</span>
                    <span className="text-neutral-800">
                      {mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-3.5 overflow-hidden">
                    <div 
                      className="bg-emerald-850 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${mrr + courtesyMrrCost > 0 ? (mrr / (mrr + courtesyMrrCost)) * 100 : 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-amber-600">Investimento em Cortesias (MRR Oculto)</span>
                    <span className="text-neutral-800">
                      {courtesyMrrCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-3.5 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${mrr + courtesyMrrCost > 0 ? (courtesyMrrCost / (mrr + courtesyMrrCost)) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="border-t pt-3 border-neutral-100 space-y-1.5 text-[11px] text-neutral-500 leading-relaxed bg-neutral-50 p-3 rounded-lg border">
                  <strong>O que é o Investimento em Cortesias?</strong>
                  Representa o potencial de faturamento mensal &quot;perdido&quot; ou doado de forma cortesia para os {courtesyCount} usuários Pro que não pagam Stripe, com base no ticket mensal base de R$ 39,90.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ABA 3: CONFIGURAÇÕES DO SISTEMA (SMTP) */}
      {activeTab === "settings" && (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="p-6 border-b border-neutral-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-800" />
            <h2 className="font-bold text-neutral-850 text-base">Configurações de E-mail (SMTP Personalizado)</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
            <div className="bg-neutral-50/50 p-4 rounded-xl border border-neutral-100 text-xs text-neutral-600 leading-relaxed">
              <span className="font-bold text-neutral-800 block mb-1">ℹ️ Como funciona a configuração SMTP?</span>
              Ao definir as configurações abaixo, o sistema passará a enviar todos os e-mails de cobrança, recuperação de inadimplência e alertas utilizando a sua conta de e-mail personalizada (ex: Gmail com Senha de App, Resend, Sendgrid, etc.). Se deixadas em branco, o sistema utilizará as variáveis do arquivo <code className="font-mono text-emerald-800">.env.local</code> ou o sandbox de e-mail local (Ethereal).
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* SMTP Host */}
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-700 block">Servidor SMTP (Host)</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="ex: smtp.gmail.com ou smtp.resend.com"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-hidden focus:border-emerald-800 transition-all font-medium bg-neutral-50/20"
                />
              </div>

              {/* SMTP Port */}
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-700 block">Porta SMTP</label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="ex: 465 ou 587"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-hidden focus:border-emerald-800 transition-all font-medium bg-neutral-50/20"
                />
              </div>

              {/* SMTP User */}
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-700 block">Usuário SMTP (E-mail)</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="ex: contato@seudominio.com.br"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-hidden focus:border-emerald-800 transition-all font-medium bg-neutral-50/20"
                />
              </div>

              {/* SMTP Pass */}
              <div className="space-y-1.5 relative">
                <label className="font-bold text-neutral-700 block">Senha SMTP</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder={initialSmtpConfig?.pass ? "••••••••••••••••" : "Sua senha ou senha de aplicativo"}
                    className="w-full rounded-xl border border-neutral-200 pl-4 pr-10 py-2.5 outline-hidden focus:border-emerald-800 transition-all font-medium bg-neutral-50/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-450 hover:text-neutral-600 focus:outline-hidden"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* SMTP From */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-bold text-neutral-700 block">Identificação do Remetente (From Header)</label>
                <input
                  type="text"
                  value={smtpFrom}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                  placeholder='ex: "Talhão Digital" <suporte@seudominio.com.br>'
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-hidden focus:border-emerald-800 transition-all font-medium bg-neutral-50/20"
                />
                <span className="text-[10px] text-neutral-400 block">Utilize o formato padrão contendo o nome e o e-mail entre sinais de menor e maior.</span>
              </div>

              {/* SMTP Secure */}
              <div className="flex items-center gap-3 md:col-span-2 py-2">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-neutral-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer"
                />
                <label htmlFor="smtpSecure" className="font-bold text-neutral-700 select-none cursor-pointer">
                  Utilizar SSL/TLS Seguro (Recomendado para porta 465)
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testLoading || settingsLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs px-5 py-3 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {testLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
                ) : (
                  <Mail className="h-4 w-4 text-neutral-500" />
                )}
                Testar Conexão SMTP
              </button>

              <button
                type="submit"
                disabled={settingsLoading || testLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-6 py-3 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {settingsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
