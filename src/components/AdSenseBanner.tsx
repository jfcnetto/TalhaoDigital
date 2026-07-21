"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sprout, ShieldCheck, Tractor, Zap } from "lucide-react";

interface AdSenseBannerProps {
  slot: "top-article" | "in-article" | "bottom-article" | "blog-grid";
  format?: "auto" | "rectangle" | "horizontal";
}

export default function AdSenseBanner({ slot, format = "auto" }: AdSenseBannerProps) {
  const [adSenseActive, setAdSenseActive] = useState(false);
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (adsenseClientId) {
      setAdSenseActive(true);
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    }
  }, [adsenseClientId]);

  // Se o Google AdSense estiver ativo com ID do cliente em produção
  if (adSenseActive && adsenseClientId) {
    return (
      <div className="my-6 text-center overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // BANNER PUBLICITÁRIO ESTÉTICO DO AGRONEGÓCIO (Seção J)
  if (slot === "top-article") {
    return (
      <div className="my-6 bg-gradient-to-r from-emerald-900 via-emerald-850 to-neutral-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden group">
        <div className="space-y-1 text-center sm:text-left z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
            <Tractor className="h-3 w-3" />
            Parceiro AgroTec
          </div>
          <h4 className="font-extrabold text-sm sm:text-base text-white">
            Pulverização Agrícola de Precisão com Drones de Alta Carga
          </h4>
          <p className="text-emerald-200 text-xs max-w-md">
            Economize até 30% em insumos e reduza o amassamento da lavoura. Solicite demonstração técnica.
          </p>
        </div>
        <Link
          href="/contato?ref=ad-drone"
          className="z-10 bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-extrabold px-4 py-2.5 rounded-xl shadow transition-transform active:scale-95 shrink-0"
        >
          Conhecer Tecnologia ➔
        </Link>
      </div>
    );
  }

  if (slot === "in-article") {
    return (
      <div className="my-8 bg-neutral-900 text-white rounded-2xl p-6 shadow-lg border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
            Publicidade Agrotecnológica
          </span>
          <h4 className="font-extrabold text-lg text-white">
            Calculadoras Agronômicas Profissionais com Emissão de PDF
          </h4>
          <p className="text-neutral-400 text-xs max-w-lg leading-relaxed">
            Elimine erros de cálculo no campo. Calcule quebra de umidade, calagem e gessagem gerando laudos prontos com a sua marca e CREA.
          </p>
        </div>
        <Link
          href="/#planos"
          className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-extrabold px-5 py-3 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Zap className="h-4 w-4" />
          Testar Plano Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="my-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-950">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-800 shrink-0 hidden sm:block">
          <Sprout className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">Soluções em Nutrição de Solos</span>
          <h5 className="font-extrabold text-sm text-neutral-900">Sementes e Adubos de Alta Eficiência para a Safra 2026</h5>
        </div>
      </div>
      <Link
        href="/contato?ref=ad-insumos"
        className="bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0"
      >
        Ver Catálogo
      </Link>
    </div>
  );
}
