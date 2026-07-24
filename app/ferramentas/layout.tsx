"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Lock, ArrowLeft, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { calculadoras } from "@/lib/calculadoras";

export default function FerramentasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const [userStatus, setUserStatus] = useState<{ isPro: boolean; role: string } | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  // Busca o status do usuário com o backend (consultando banco e Stripe)
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

  // Se for a rota principal de listagem (/ferramentas), renderiza direto
  const isMainPage = pathname === "/ferramentas" || pathname === "/ferramentas/";
  if (isMainPage) {
    return <>{children}</>;
  }

  // Identifica a ferramenta atual pelo slug
  const slug = pathname.split("/").pop();
  const calculadora = calculadoras.find((c) => c.slug === slug);

  // Se ainda estiver carregando a autenticação ou o status do plano, exibe o Loading
  if (!isClerkLoaded || (isSignedIn && isStatusLoading)) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-neutral-50 text-neutral-900">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm max-w-sm text-center">
          <RefreshCw className="h-10 w-10 text-emerald-800 animate-spin" />
          <h2 className="text-lg font-bold text-neutral-800">Verificando Credenciais...</h2>
          <p className="text-sm text-neutral-500">Aguarde um instante enquanto validamos sua assinatura e perfil de acesso.</p>
        </div>
      </div>
    );
  }

  // 1. Caso NÃO esteja logado: impede acesso a qualquer ferramenta
  if (!isSignedIn) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-neutral-50 px-4 py-12 text-neutral-900">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 border border-amber-100">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-neutral-950">Acesso Restrito</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Para acessar as calculadoras agronômicas de precisão do Talhão Digital, você precisa estar autenticado em sua conta.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <SignInButton mode="modal">
              <button className="flex w-full items-center justify-center rounded-xl bg-emerald-800 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-900 transition-colors">
                Entrar na Minha Conta
              </button>
            </SignInButton>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para a Página Inicial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Se a calculadora não estiver listada no mapeamento, permite a renderização
  if (!calculadora) {
    return <>{children}</>;
  }

  // 2. Se a calculadora for do plano Pro, mas o usuário NÃO for Pro: bloqueia acesso
  const isProRequired = calculadora.plano === "Pro";
  const userHasPro = userStatus?.isPro === true;

  if (isProRequired && !userHasPro) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-neutral-50 px-4 py-12 text-neutral-900">
        <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-350">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-800 to-emerald-950" />
          
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100">
            <Sparkles className="h-8 w-8" />
          </div>
          
          <span className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-850 text-xs font-extrabold border border-emerald-200">
            🔒 Exclusivo do Plano Pro
          </span>
          
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-neutral-950">
            {calculadora.nome}
          </h1>
          
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Esta ferramenta faz cálculos avançados e está reservada para os assinantes do **Plano Pro**. Assine hoje para emitir laudos técnicos em PDF com dados do produtor, CREA, rodapés personalizados e muito mais.
          </p>

          <div className="mt-6 rounded-2xl bg-neutral-50 p-5 text-left border border-neutral-100 space-y-2">
            <h4 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">O que esta ferramenta faz:</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">{calculadora.descricao}</p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/#planos"
              className="flex-1 flex items-center justify-center rounded-xl bg-emerald-800 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-900 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150"
            >
              Conhecer Planos & Assinar
            </Link>
            <Link
              href="/ferramentas"
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Ver Outras Calculadoras
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Usuário logado e possui as permissões corretas
  return <>{children}</>;
}
