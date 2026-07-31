"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Calculator, FileText, Info, HelpCircle, Printer, ArrowLeft, Lock, Download, Save } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTechnicalReport } from "@/hooks/useTechnicalReport";

export default function CalagemGessagemClient({ isPro = false, userName }: { isPro?: boolean, userName?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');

  // Inputs Analise de Solo
  const [ca, setCa] = useState<number>(1.2);
  const [mg, setMg] = useState<number>(0.5);
  const [k, setK] = useState<number>(0.15);
  const [hAl, setHAl] = useState<number>(4.0);
  
  // Parâmetros Agronômicos
  const [v2, setV2] = useState<number>(70);
  const [prnt, setPrnt] = useState<number>(85);
  const [argila, setArgila] = useState<number>(45);

  // Laudo Técnico (Obrigatórios)
  const [produtor, setProdutor] = useState<string>("");
  const [propriedade, setPropriedade] = useState<string>("");
  const [nomeLaudo, setNomeLaudo] = useState<string>("");
  const [responsavelTecnico, setResponsavelTecnico] = useState<string>(userName || "");
  const [profile, setProfile] = useState<{
    creaCrtq?: string;
    conselhoEstado?: string;
    logoUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (userName) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          setProfile(data);
          if (data.name) {
            setResponsavelTecnico(data.name);
          }
        })
        .catch((err) => console.error("Erro ao buscar perfil complementar:", err));
    }
  }, [userName]);

  const reportRef = useRef<HTMLDivElement>(null);

  // Proteção Anti-PrintScreen
  useEffect(() => {
    if (isPro) return;
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        try { navigator.clipboard?.writeText(""); } catch (err) {}
        alert("🔒 A captura de tela deste relatório é bloqueada no Plano Gratuito. Assine o Plano Pro!");
      }
    };
    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, [isPro]);

  // Cálculos Agronômicos - Saturação por Bases
  const sb = ca + mg + k;
  const ctc = sb + hAl;
  const v1 = ctc > 0 ? (sb / ctc) * 100 : 0;
  
  // Necessidade de Calcário (ton/ha)
  const nc = prnt > 0 ? Math.max(0, (ctc * (v2 - v1)) / prnt) : 0;
  
  // Necessidade de Gesso (ton/ha) - Fórmula genérica Cerrado (50 * Argila)
  const ngKg = 50 * argila;
  const ngTon = ngKg / 1000;

  // Consome o hook customizado centralizado
  const {
    isSaved,
    loadingSave,
    pdfBlob,
    showValidationError,
    setShowValidationError,
    isFormValid,
    handleSaveOnly,
    handleImprimir,
    handleGerarPdf
  } = useTechnicalReport({
    toolId: "calagem-gessagem",
    area: "agricultura",
    inputs: { ca, mg, k, hAl, v2, prnt, argila },
    results: { sb, ctc, v1, nc, ngKg, ngTon },
    nomeLaudo,
    cliente: produtor,
    propriedade,
    responsavelTecnico,
    isPro,
    profileComplementar: profile,
    reportRef,
    pdfFileNamePrefix: "calagem-gessagem",
    onLoadReportData: (loadedInputs, loadedClient, loadedProf) => {
      setCa(Number(loadedInputs.ca || 0));
      setMg(Number(loadedInputs.mg || 0));
      setK(Number(loadedInputs.k || 0));
      setHAl(Number(loadedInputs.hAl || 0));
      setV2(Number(loadedInputs.v2 || 0));
      setPrnt(Number(loadedInputs.prnt || 0));
      setArgila(Number(loadedInputs.argila || 0));
      setProdutor(loadedClient.cliente || "");
      setPropriedade(loadedClient.propriedade || "");
      setNomeLaudo(loadedClient.nomeLaudo || "");
      if (loadedProf?.responsavel) {
        setResponsavelTecnico(loadedProf.responsavel);
      }
    }
  });

  return (
    <div className={`min-h-screen bg-neutral-50/50 flex flex-col ${!isPro ? "select-none" : ""}`} onContextMenu={(e) => !isPro && e.preventDefault()}>
      <div className="no-print">
        <Header />
      </div>

      {/* Container Principal */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        
        {/* Cabeçalho de Navegação e Título */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button
              onClick={() => {
                router.push('/dashboard');
                router.refresh();
              }}
              className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao Dashboard
            </button>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Calculadora de Calagem e Gessagem
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Determine a Necessidade de Calcário (NC) pelo método V% e a Necessidade de Gesso (NG).
              <Link href="/ajuda#calagem-gessagem" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
                (Como usar?)
              </Link>
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {isPro ? (
              <>
                <button
                  onClick={handleSaveOnly}
                  disabled={!isFormValid || loadingSave}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loadingSave ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={handleImprimir}
                  disabled={!isFormValid || !isSaved}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={() => handleGerarPdf(false)}
                  disabled={!isFormValid || !isSaved}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Gerar PDF
                </button>
                <ShareButton
                  pdfBlob={pdfBlob}
                  fileName={`calagem-gessagem-${nomeLaudo.replace(/\s+/g, "-").toLowerCase()}`}
                  nomeLaudo={nomeLaudo}
                  responsavel={responsavelTecnico}
                  disabled={!isFormValid}
                  onGeneratePdf={() => handleGerarPdf(true)}
                />
              </>
            ) : (
              <>
                <Link href="/#planos" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-100 transition-colors">
                  <Lock className="w-4 h-4 mr-2" />
                  Salvar
                </Link>
                <Link href="/#planos" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-500 hover:bg-neutral-200 transition-colors">
                  <Lock className="w-4 h-4 mr-2" />
                  Imprimir
                </Link>
                <Link href="/#planos" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-600/50 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-emerald-600/70 transition-colors">
                  <Lock className="w-4 h-4 mr-2" />
                  Gerar PDF
                </Link>
                <Link href="/#planos" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-amber-600/50 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-amber-600/70 transition-colors">
                  <Lock className="w-4 h-4 mr-2" />
                  Compartilhar
                </Link>
              </>
            )}
          </div>
        </div>

        {!isPro && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 mr-3 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Recurso Premium</h3>
              <p className="text-sm text-amber-800 mt-1">
                A geração de laudos em PDF e impressão estão disponíveis apenas no Plano Pro. 
                <Link href="/#planos" className="font-bold underline ml-1">Fazer upgrade</Link>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Coluna da Esquerda: Inputs (7 colunas) */}
          <div className="lg:col-span-7 space-y-6">
              <h2 className="font-bold text-lg text-neutral-800 border-b pb-3 border-neutral-100">
                Análise de Solo
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">Cálcio (Ca) <span className="font-normal text-neutral-400">cmolc/dm³</span></label>
                    <input
                      type="number" step="0.01" value={ca || ""}
                      onChange={(e) => setCa(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">Magnésio (Mg) <span className="font-normal text-neutral-400">cmolc/dm³</span></label>
                    <input
                      type="number" step="0.01" value={mg || ""}
                      onChange={(e) => setMg(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">Potássio (K) <span className="font-normal text-neutral-400">cmolc/dm³</span></label>
                    <input
                      type="number" step="0.01" value={k || ""}
                      onChange={(e) => setK(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">Acidez (H+Al) <span className="font-normal text-neutral-400">cmolc/dm³</span></label>
                    <input
                      type="number" step="0.01" value={hAl || ""}
                      onChange={(e) => setHAl(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <h2 className="font-bold text-lg text-neutral-800 border-b pb-3 border-neutral-100 mt-6">
                Parâmetros Alvo
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">V% Desejada (V2)</label>
                    <input
                      type="number" step="1" value={v2 || ""}
                      onChange={(e) => setV2(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">PRNT do Calcário (%)</label>
                    <input
                      type="number" step="1" value={prnt || ""}
                      onChange={(e) => setPrnt(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">Teor de Argila (%) <span className="font-normal text-neutral-400">Para Gessagem</span></label>
                  <input
                    type="number" step="1" value={argila || ""}
                    onChange={(e) => setArgila(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Laudo */}
              <div className="pt-4 border-t border-neutral-100 space-y-4">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1">
                  Laudo Técnico <span className="text-red-500 font-bold">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Responsável Técnico *</label>
                    <input
                      type="text" placeholder="Nome do agrônomo ou técnico"
                      value={responsavelTecnico}
                      readOnly={!!userName}
                      onChange={(e) => {
                        setResponsavelTecnico(e.target.value);
                        if(produtor.trim() !== "" && e.target.value.trim() !== "") setShowValidationError(false);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && responsavelTecnico.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"} ${userName ? "bg-neutral-100 text-neutral-500 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Produtor / Cliente *</label>
                    <input
                      type="text" placeholder="Nome do produtor"
                      value={produtor}
                      onChange={(e) => {
                        setProdutor(e.target.value);
                        if(e.target.value.trim() !== "" && responsavelTecnico.trim() !== "") setShowValidationError(false);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && produtor.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Propriedade / Fazenda</label>
                    <input
                      type="text" placeholder="Nome da propriedade/fazenda"
                      value={propriedade}
                      onChange={(e) => setPropriedade(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg text-sm transition-colors"
                    />
                  </div>
                <div>
  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Nome do Laudo *</label>
  <input
    type="text"
    placeholder="Ex: Calagem Fazenda X 2026"
    value={nomeLaudo}
    onChange={(e) => {
      setNomeLaudo(e.target.value);
      if (e.target.value.trim() !== "" && responsavelTecnico.trim() !== "" && produtor.trim() !== "" && propriedade.trim() !== "") setShowValidationError(false);
    }}
    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && nomeLaudo.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
  />
</div>
</div>
                {showValidationError && (
                  <p className="text-[11px] font-medium text-red-600 animate-pulse mt-1">
                    ⚠️ Os campos Responsável Técnico, Produtor / Cliente, Propriedade / Fazenda e Identificação do Laudo são obrigatórios.
                  </p>
                )}
              </div>
            </div>

          {/* Coluna da Direita: Resultados (5 colunas) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-6 space-y-6">
              
              <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900 rounded-full blur-2xl opacity-40 -mr-8 -mt-8" />
                
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider block">
                  Necessidade de Calcário (NC)
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {nc.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-lg text-emerald-300 font-semibold">Ton/ha</span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-emerald-900 pt-4 text-sm mb-6">
                  <div>
                    <span className="text-emerald-400 text-xs block">Saturação Atual (V1)</span>
                    <span className="font-bold text-lg mt-0.5 block text-white">
                      {v1.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-xs block">Necessidade de Gesso (NG)</span>
                    <span className="font-bold text-lg mt-0.5 block text-amber-300">
                      {ngTon.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} Ton/ha
                    </span>
                  </div>
                </div>

                {!isPro ? null : !isFormValid ? (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10 animate-pulse">
                    ⚠️ Preencha o Responsável, Produtor e a Propriedade para emitir o Laudo.
                  </div>
                ) : !isSaved ? (
                  <div className="mt-3 p-3 rounded-xl bg-amber-900/40 border border-amber-500/30 text-xs text-amber-200 relative z-10 animate-pulse">
                    ⚠️ Clique em "Salvar" no topo para gravar no histórico e liberar a emissão do Laudo.
                  </div>
                ) : null}
              </div>

              {/* Composição da CTC e Gráfico */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-neutral-850 text-base">
                    Composição da CTC (Saturação Atual)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Gráfico SVG de composição */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3.2"
                          strokeDasharray={`${ctc > 0 ? (ca / ctc) * 100 : 0} ${100 - (ctc > 0 ? (ca / ctc) * 100 : 0)}`}
                          strokeDashoffset="0"
                          className="transition-all duration-300"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3.2"
                          strokeDasharray={`${ctc > 0 ? (mg / ctc) * 100 : 0} ${100 - (ctc > 0 ? (mg / ctc) * 100 : 0)}`}
                          strokeDashoffset={`-${ctc > 0 ? (ca / ctc) * 100 : 0}`}
                          className="transition-all duration-300"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="3.2"
                          strokeDasharray={`${ctc > 0 ? (k / ctc) * 100 : 0} ${100 - (ctc > 0 ? (k / ctc) * 100 : 0)}`}
                          strokeDashoffset={`-${ctc > 0 ? ((ca + mg) / ctc) * 100 : 0}`}
                          className="transition-all duration-300"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3.2"
                          strokeDasharray={`${ctc > 0 ? (hAl / ctc) * 100 : 0} ${100 - (ctc > 0 ? (hAl / ctc) * 100 : 0)}`}
                          strokeDashoffset={`-${ctc > 0 ? (sb / ctc) * 100 : 0}`}
                          className="transition-all duration-300"
                        />
                        <text
                          x="18"
                          y="16.5"
                          fontFamily="sans-serif"
                          fontSize="6"
                          fontWeight="800"
                          fill="#262626"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform="rotate(90 18 18)"
                        >
                          {v1.toFixed(1)}%
                        </text>
                        <text
                          x="18"
                          y="22"
                          fontFamily="sans-serif"
                          fontSize="3"
                          fontWeight="700"
                          fill="#a3a3a3"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform="rotate(90 18 18)"
                        >
                          SATURAÇÃO
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Legendas */}
                  <div className="md:col-span-7 space-y-4 text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Cálcio (Ca)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-neutral-900 block">{ca.toFixed(2)} cmolc</span>
                        <span className="text-xs text-neutral-400">({ctc > 0 ? ((ca / ctc) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Magnésio (Mg)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-neutral-900 block">{mg.toFixed(2)} cmolc</span>
                        <span className="text-xs text-neutral-400">({ctc > 0 ? ((mg / ctc) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Potássio (K)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-neutral-900 block">{k.toFixed(2)} cmolc</span>
                        <span className="text-xs text-neutral-400">({ctc > 0 ? ((k / ctc) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Acidez (H+Al)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-neutral-900 block">{hAl.toFixed(2)} cmolc</span>
                        <span className="text-xs text-neutral-400">({ctc > 0 ? ((hAl / ctc) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Memória de Cálculo Agronômico (Ocupa 12 colunas ao final) */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-neutral-800 flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-emerald-800" />
              Memória de Cálculo Agronômico
            </h3>
            <div className="text-sm text-neutral-600 space-y-4 leading-relaxed">
              <p>
                Os cálculos de calagem e gessagem utilizam os dados obtidos na análise física e química do solo para elevar a saturação por bases ao nível exigido pela cultura e fornecer cálcio e enxofre em profundidade.
              </p>
              <div className="bg-neutral-50 p-4 rounded-xl space-y-3 font-mono text-xs text-neutral-700">
                <div>
                  <span className="text-emerald-800 font-bold block mb-1">1. Soma de Bases (SB):</span>
                  SB = Ca + Mg + K = {ca} + {mg} + {k} = {sb.toFixed(2)} cmolc/dm³
                </div>
                <div className="pt-3 border-t border-neutral-200">
                  <span className="text-emerald-800 font-bold block mb-1">2. Capacidade de Troca Catiônica (CTC):</span>
                  CTC = SB + (H+Al) = {sb.toFixed(2)} + {hAl} = {ctc.toFixed(2)} cmolc/dm³
                </div>
                <div className="pt-3 border-t border-neutral-200">
                  <span className="text-emerald-800 font-bold block mb-1">3. Saturação por Bases Atual (V% - V1):</span>
                  V1 = (SB / CTC) * 100 = ({sb.toFixed(2)} / {ctc.toFixed(2)}) * 100 = {v1.toFixed(1)}%
                </div>
                <div className="pt-3 border-t border-neutral-200">
                  <span className="text-emerald-800 font-bold block mb-1">4. Necessidade de Calagem (NC - Ton/ha):</span>
                  NC = (CTC * (V2 - V1)) / PRNT = ({ctc.toFixed(2)} * ({v2} - {v1.toFixed(1)})) / {prnt} = {nc.toFixed(2)} Ton/ha
                </div>
                <div className="pt-3 border-t border-neutral-200">
                  <span className="text-emerald-800 font-bold block mb-1">5. Necessidade de Gesso (NG - Ton/ha) - Embrapa Cerrados:</span>
                  NG = 50 * Argila = 50 * {argila} = {ngKg} kg/ha ({ngTon.toFixed(2)} Ton/ha)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print"><Footer /></div>

      {/* ------------------------------------------------------------- */}
      {/* ----------------- ESTRUTURA PARA PDF/PRINT ------------------- */}
      {/* ------------------------------------------------------------- */}
      {isPro && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div id="pdf-content" ref={reportRef} className="w-[210mm] bg-white text-neutral-900 p-10 print-only-container min-h-[270mm] flex flex-col">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-6 border-neutral-200">
              <div className="space-y-2">
                <span className="text-3xl font-extrabold text-emerald-850 tracking-tight block">Talhão<span className="text-emerald-600">Digital</span></span>
                <span className="text-xs text-neutral-400 block mt-2">Laudos e Diagnósticos Agronômicos de Precisão</span>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <span className="block font-bold">Relatório Técnico Digital</span>
                <span className="block mt-0.5" suppressHydrationWarning>{new Date().toLocaleDateString("pt-BR")}</span>
              </div>
            </div>

            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-neutral-400 block font-semibold uppercase">Responsável Técnico</span>
                <span className="text-sm font-bold text-neutral-800 mt-0.5 block">{responsavelTecnico}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-semibold uppercase">Produtor / Cliente</span>
                <span className="text-sm font-bold text-neutral-800 mt-0.5 block">{produtor}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-semibold uppercase">Propriedade / Fazenda</span>
                <span className="text-sm font-bold text-neutral-800 mt-0.5 block">{propriedade || "Não Informada"}</span>
              </div>
            </div>
            <div className="pt-2.5 border-t border-neutral-200/60 text-xs mb-4">
              <span className="text-neutral-400 block font-semibold uppercase">Nome do Laudo</span>
              <span className="text-sm font-bold text-neutral-800 mt-0.5 block">Calagem/Gessagem - {nomeLaudo}</span>
            </div>

            <h2 className="text-lg font-bold text-neutral-900 border-b pb-2 border-neutral-200">
              Recomendação de Calagem e Gessagem
            </h2>

            <div className="grid grid-cols-12 gap-6 items-center">
              
              {/* Tabela de Resultados (8 colunas) */}
              <div className="col-span-8 space-y-4">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700">
                      <th className="p-2 font-bold">Parâmetro de Solo</th>
                      <th className="p-2 font-bold text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr><td className="p-2">Cálcio (Ca)</td><td className="p-2 text-right font-bold">{ca.toFixed(2)} cmolc/dm³</td></tr>
                    <tr><td className="p-2">Magnésio (Mg)</td><td className="p-2 text-right font-bold">{mg.toFixed(2)} cmolc/dm³</td></tr>
                    <tr><td className="p-2">Potássio (K)</td><td className="p-2 text-right font-bold">{k.toFixed(2)} cmolc/dm³</td></tr>
                    <tr><td className="p-2">Acidez (H+Al)</td><td className="p-2 text-right font-bold">{hAl.toFixed(2)} cmolc/dm³</td></tr>
                    <tr className="bg-neutral-50"><td className="p-2 font-bold">Soma de Bases (SB)</td><td className="p-2 text-right font-bold">{sb.toFixed(2)} cmolc/dm³</td></tr>
                    <tr className="bg-neutral-50"><td className="p-2 font-bold">CTC</td><td className="p-2 text-right font-bold">{ctc.toFixed(2)} cmolc/dm³</td></tr>
                    <tr className="bg-amber-50 text-amber-900"><td className="p-2 font-bold">V% Atual</td><td className="p-2 text-right font-bold">{v1.toFixed(1)}%</td></tr>
                    <tr><td className="p-2">Argila</td><td className="p-2 text-right font-bold">{argila}%</td></tr>
                  </tbody>
                </table>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-800">
                      <th className="p-2 font-bold">Recomendação Alvo</th>
                      <th className="p-2 font-bold text-right">Dose Indicada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    <tr><td className="p-2">V% Alvo (Desejada)</td><td className="p-2 text-right font-bold text-emerald-900">{v2}%</td></tr>
                    <tr><td className="p-2">PRNT do Calcário</td><td className="p-2 text-right font-bold text-emerald-900">{prnt}%</td></tr>
                    <tr className="bg-emerald-800 text-white"><td className="p-2 font-bold rounded-l">Necessidade de Calcário (NC)</td><td className="p-2 text-right font-bold rounded-r text-base">{nc.toFixed(2)} Ton/ha</td></tr>
                    <tr className="bg-amber-100 text-amber-900"><td className="p-2 font-bold rounded-l">Necessidade de Gesso (NG)</td><td className="p-2 text-right font-bold rounded-r text-base">{ngTon.toFixed(2)} Ton/ha</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Gráfico SVG (4 colunas) no PDF */}
              <div className="col-span-4 flex flex-col items-center justify-center border border-neutral-100 rounded-xl p-3 bg-neutral-50/30">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block text-center">Composição da CTC</span>
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeDasharray={`${ctc > 0 ? (ca / ctc) * 100 : 0} ${100 - (ctc > 0 ? (ca / ctc) * 100 : 0)}`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3.5"
                      strokeDasharray={`${ctc > 0 ? (mg / ctc) * 100 : 0} ${100 - (ctc > 0 ? (mg / ctc) * 100 : 0)}`}
                      strokeDashoffset={`-${ctc > 0 ? (ca / ctc) * 100 : 0}`}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="3.5"
                      strokeDasharray={`${ctc > 0 ? (k / ctc) * 100 : 0} ${100 - (ctc > 0 ? (k / ctc) * 100 : 0)}`}
                      strokeDashoffset={`-${ctc > 0 ? ((ca + mg) / ctc) * 100 : 0}`}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3.5"
                      strokeDasharray={`${ctc > 0 ? (hAl / ctc) * 100 : 0} ${100 - (ctc > 0 ? (hAl / ctc) * 100 : 0)}`}
                      strokeDashoffset={`-${ctc > 0 ? (sb / ctc) * 100 : 0}`}
                    />
                    <text
                      x="18"
                      y="16.5"
                      fontFamily="sans-serif"
                      fontSize="6"
                      fontWeight="800"
                      fill="#262626"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform="rotate(90 18 18)"
                    >
                      {v1.toFixed(1)}%
                    </text>
                    <text
                      x="18"
                      y="22"
                      fontFamily="sans-serif"
                      fontSize="3"
                      fontWeight="700"
                      fill="#a3a3a3"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform="rotate(90 18 18)"
                    >
                      SATURAÇÃO
                    </text>
                  </svg>
                </div>
                
                {/* Legendas do Gráfico no PDF */}
                <div className="mt-3 space-y-1 text-[8px] text-neutral-600 w-full font-medium">
                  <div className="flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> <span>Cálcio</span>
                    </div>
                    <span>{ctc > 0 ? ((ca / ctc) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" /> <span>Magnésio</span>
                    </div>
                    <span>{ctc > 0 ? ((mg / ctc) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" /> <span>Potássio</span>
                    </div>
                    <span>{ctc > 0 ? ((k / ctc) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" /> <span>H+Al</span>
                    </div>
                    <span>{ctc > 0 ? ((hAl / ctc) * 100).toFixed(0) : 0}%</span>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="mt-8 p-4 border rounded-xl bg-neutral-50 text-xs text-neutral-600">
              <strong>Observação:</strong> A aplicação do calcário deve ser feita com antecedência e incorporada ao solo (exceto plantio direto consolidado). O gesso pode ser aplicado em cobertura. Consulte sempre um Engenheiro Agrônomo local.
            </div>

          </div>
          
          <div className="border-t pt-6 border-neutral-200 text-[10px] text-neutral-400 text-center space-y-1 mt-auto">
            <span className="block font-bold">Talhão Digital - www.talhaodigital.com.br</span>
            <span className="block">Este laudo técnico foi emitido digitalmente e é baseado no método de saturação por bases.</span>
          </div>
          </div>
        </div>
      )}

      {/* Esconder na impressão os elementos de tela */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          ${isPro ? 
            "#pdf-content, #pdf-content * { visibility: visible; } #pdf-content { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 20mm !important; }" 
          : 
            "body { display: none !important; }"
          }
        }
      `}} />
    </div>
  );
}
