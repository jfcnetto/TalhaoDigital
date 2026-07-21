"use client";

import { useState } from "react";
import { Users, Shield, Award, CreditCard, RefreshCw, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminClientProps {
  initialUsers: any[];
  subscriptions: any[];
  plans: any[];
}

export default function AdminClient({ initialUsers, subscriptions, plans }: AdminClientProps) {
  const router = useRouter();
  const [usersList, setUsersList] = useState(initialUsers);
  
  const [syncLoading, setSyncLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sincronizar planos do Stripe
  const handleSyncPlans = async () => {
    setSyncLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/stripe/sync-plans");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao sincronizar");
      setStatusMessage({ type: "success", text: data.message });
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

  return (
    <div className="space-y-8">
      
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
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* PAINEL: USUÁRIOS & ASSINATURAS DO STRIPE */}
      <div className="space-y-8">
        {/* Sincronizar Stripe */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-neutral-800 text-base">Catálogo de Planos do Stripe</h3>
            <p className="text-neutral-500 text-xs mt-1">
              Mantenha a tabela de planos local sincronizada com os preços e produtos do seu Stripe Dashboard.
            </p>
          </div>
          <button
            onClick={handleSyncPlans}
            disabled={syncLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-3 shadow transition-all active:scale-[0.98] disabled:opacity-60"
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
            <Users className="h-5 w-5 text-emerald-855" />
            <h2 className="font-bold text-neutral-800 text-base">Gerenciamento de Usuários ({usersList.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-150 text-neutral-600 font-bold">
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
                                ? "bg-amber-50 border-amber-250 text-amber-700" 
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
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleUserAction(user.id, "toggle-courtesy")}
                          disabled={actionLoading !== null}
                          className={`inline-flex items-center justify-center font-bold px-3 py-1.5 rounded-lg border text-[10.5px] shadow-sm transition-all duration-150 active:scale-95 ${
                            user.isCourtesyPro 
                              ? "bg-white hover:bg-red-50 border-red-200 text-red-650 hover:border-red-305"
                              : "bg-white hover:bg-emerald-50 border-neutral-200 text-emerald-850 hover:border-emerald-305"
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
                          className="inline-flex items-center justify-center font-bold px-3 py-1.5 rounded-lg border text-[10.5px] shadow-sm transition-all duration-150 active:scale-95 bg-white hover:bg-neutral-50 border-neutral-250 text-neutral-700"
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

    </div>
  );
}
