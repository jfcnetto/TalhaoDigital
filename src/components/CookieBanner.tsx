"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verifica no localStorage se o usuário já aceitou os cookies
    const consent = localStorage.getItem("talhaodigital_cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("talhaodigital_cookie_consent", "accepted");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 bg-white/95 backdrop-blur-md border border-neutral-200 p-5 rounded-2xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 text-emerald-800 font-extrabold text-sm">
          <Cookie className="h-5 w-5 text-emerald-800 shrink-0" />
          <span>Privacidade & Cookies (LGPD)</span>
        </div>
        <button
          onClick={handleAccept}
          className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 rounded-lg"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-neutral-600 leading-relaxed">
        Utilizamos cookies essenciais para garantir o funcionamento correto da plataforma, autenticação segura e navegação personalizada conforme a nossa{" "}
        <Link href="/privacidade" className="text-emerald-800 font-bold underline hover:text-emerald-950">
          Política de Privacidade (LGPD)
        </Link>.
      </p>

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          onClick={handleAccept}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all active:scale-[0.98] cursor-pointer"
        >
          <ShieldCheck className="h-4 w-4" />
          Aceitar e Continuar
        </button>
      </div>
    </div>
  );
}
