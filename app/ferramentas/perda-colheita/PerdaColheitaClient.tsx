"use client"

import React from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PerdaColheitaClientProps {
  isPro: boolean;
  userName?: string;
}

export default function PerdaColheitaClient({ isPro, userName }: PerdaColheitaClientProps) {
  // Parâmetros de Entrada da Amostragem
  const [cultura, setCultura] = useState<"soja" | "milho" | "algodao" | "trigo" | "sorgo" | "arroz" | "feijao" | "cana" | "cafe">("soja");
  const [larguraPlataforma, setLarguraPlataforma] = useState<number>(7.5); // metros (Ex: 25 pés)
  const [graosAmostrados, setGraosAmostrados] = useState<number>(45); // número de grãos encontrados na área amostrada
  const [areaAro, setAreaAro] = useState<number>(2.0); // m² (Aro de amostragem padrão de 2 m² ou armações de lona)
  const [pesoMilGraos, setPesoMilGraos] = useState<number>(150); // gramas (Peso de 1000 grãos)

  // Identificação do Laudo
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");

  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [showValidationError, setShowValidationError] = useState<boolean>(false);

  // --- Memória de Cálculo Agronômico / Perdas ---
  // A perda por metro quadrado (grãos/m²):
  const graosPorM2 = areaAro > 0 ? graosAmostrados / areaAro : 0;

  // Peso unitário de um grão em gramas:
  const pesoGraoG = pesoMilGraos / 1000;

  // Perda por hectare (kg/ha):
  // 1 ha = 10.000 m²
  // Perda (kg/ha) = (grãos/m² * peso do grão em gramas * 10.000) / 1000 = grãos/m² * peso do grão * 10
  const perdaKgHa = graosPorM2 * pesoGraoG * 10;

  // Perda em Sacas de 60kg por hectare (sc/ha):
  const perdaScHa = perdaKgHa / 60;

  // Diagnóstico de perda admissível Embrapa (Limites toleráveis: Soja = 60 kg/ha; Milho = 90 kg/ha; Trigo = 45 kg/ha; Sorgo = 80 kg/ha; Algodão = 100 kg/ha)
  const getCulturaSpecs = () => {
    switch (cultura) {
      case "soja": return { limite: 60, pmg: 150 };
      case "milho": return { limite: 90, pmg: 300 };
      case "trigo": return { limite: 45, pmg: 35 };
      case "sorgo": return { limite: 80, pmg: 28 };
      case "algodao": return { limite: 100, pmg: 90 };
      case "arroz": return { limite: 80, pmg: 30 };
      case "feijao": return { limite: 60, pmg: 240 };
      case "cana": return { limite: 120, pmg: 0 };
      case "cafe": return { limite: 70, pmg: 200 };
      default: return { limite: 60, pmg: 150 };
    }
  };

  const { limite: limiteToleravel } = getCulturaSpecs();
  const dentroDoLimite = perdaKgHa <= limiteToleravel;

  // Variáveis para o Gráfico de Rosca SVG
  // Mapeia o desvio percentual em relação ao teto tolerável
  const pctDentro = Math.min(100, Math.round((perdaKgHa / limiteToleravel) * 100));
  const pctExcedente = Math.max(0, 100 - pctDentro);

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "";

  const handleImprimir = () => {
    if (!isPro) {
      window.location.href = "/#planos";
      return;
    }
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    window.print();
  };

  const handleGerarPdf = async () => {
    if (!isPro) {
      window.location.href = "/#planos";
      return;
    }
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);

    if (gerandoPdf) return;
    
    setGerandoPdf(true);
    try {
      const element = document.getElementById("pdf-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Perdas-Colheita-${cliente || "Laudo"}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

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
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Estimador de Perda de Grãos na Colheita
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Avalie o índice de perdas (sacas/ha) na colheita mecanizada de grãos usando o método do aro de amostragem no solo.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {isPro ? (
              <>
                <button
                  onClick={handleImprimir}
                  disabled={!isFormValid}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={handleGerarPdf}
                  disabled={!isFormValid || gerandoPdf}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gerandoPdf ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {gerandoPdf ? "Gerando..." : "Gerar PDF"}
                </button>
              </>
            ) : (
              <>
                <Link href="/#planos" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-500 hover:bg-neutral-200 transition-colors">
                  <Lock className="w-4 h-4 mr-2" />
                  Imprimir
                </Link>
                <Link href="/#planos" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-600/50 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-emerald-600/70 transition-colors">
                  <Lock className="w-4 h-4 mr-2" />
                  Gerar PDF
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
            
            {/* Bloco 1: Cultura & Amostragem */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Parâmetros de Amostragem</h2>
                <p className="text-xs text-neutral-500 mt-1">Configure o tipo de grão e dimensões da coleta de campo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Cultura Agrícola</label>
                  <select
                    value={cultura}
                    onChange={(e) => {
                       const val = e.target.value as "soja" | "milho" | "algodao" | "trigo" | "sorgo" | "arroz" | "feijao" | "cana" | "cafe";
                      setCultura(val);
                      // Ajustar PMG típico
                       const pmgTabela: Record<string, number> = { soja: 150, milho: 300, trigo: 35, sorgo: 28, algodao: 90, arroz: 30, feijao: 240, cana: 0, cafe: 200 };
                      setPesoMilGraos(pmgTabela[val] ?? 150);
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    <option value="soja">Soja (Limite: 60 kg/ha)</option>
                    <option value="milho">Milho (Limite: 90 kg/ha)</option>
                    <option value="trigo">Trigo (Limite: 45 kg/ha)</option>
                    <option value="sorgo">Sorgo (Limite: 80 kg/ha)</option>
                    <option value="algodao">Algodão (Limite: 100 kg/ha)</option>
                    <option value="arroz">Arroz (Limite: 80 kg/ha)</option>
                    <option value="feijao">Feijão (Limite: 60 kg/ha)</option>
                     <option value="cana">Cana-de-Açúcar (Limite: 120 kg/ha)</option>
                     <option value="cafe">Café (Limite: 70 kg/ha)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Largura da Plataforma (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={larguraPlataforma || ""}
                    onChange={(e) => setLarguraPlataforma(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Grãos Encontrados (Aro)</label>
                  <input
                    type="number"
                    value={graosAmostrados || ""}
                    onChange={(e) => setGraosAmostrados(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Área do Aro (m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={areaAro || ""}
                    onChange={(e) => setAreaAro(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Peso de 1000 Grãos (g)</label>
                  <input
                    type="number"
                    value={pesoMilGraos || ""}
                    onChange={(e) => setPesoMilGraos(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Identificação do Laudo */}
            <div className="pt-4 border-t border-neutral-100 space-y-4">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1">
                Laudo Técnico <span className="text-red-500 font-bold">*</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Responsável Técnico *</label>
                  <input
                    type="text"
                    value={responsavel}
                    readOnly={!!userName}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Nome do agrônomo ou técnico"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && responsavel.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"} ${userName ? "bg-neutral-100 text-neutral-500 cursor-not-allowed" : ""}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Produtor / Cliente *</label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => {
                      setCliente(e.target.value);
                      if (e.target.value.trim() !== "" && responsavel.trim() !== "") setShowValidationError(false);
                    }}
                    placeholder="Nome do produtor ou fazenda"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && cliente.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
                  />
                </div>
              </div>
              {showValidationError && (
                <p className="text-[11px] font-medium text-red-600 animate-pulse mt-2">
                  ⚠️ O campo Produtor / Cliente é obrigatório para emitir laudos e relatórios.
                </p>
              )}
            </div>
          </div>

          {/* Coluna da Direita: Resultados (5 colunas) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-6 space-y-6">
              
              {/* Card Destaque Hero (Padrão SaaS) */}
              <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900 rounded-full blur-2xl opacity-40 -mr-8 -mt-8" />
                
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider block">
                  Perda de Grãos Estimada (Kg/Ha)
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {perdaKgHa.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                  <span className="text-lg text-emerald-300 font-semibold">kg / ha</span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-emerald-900 pt-4 text-sm mb-6">
                  <div>
                    <span className="text-emerald-400 text-xs block">Equivalente Sacas</span>
                    <span className="font-bold text-lg mt-0.5 block text-white">
                      {perdaScHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc/ha
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-xs block">Status Operacional</span>
                    <span className={`font-bold text-sm mt-1.5 block uppercase ${dentroDoLimite ? "text-emerald-300" : "text-red-400 animate-pulse"}`}>
                      {dentroDoLimite ? "🟢 Conforme" : "⚠️ Perda Elevada"}
                    </span>
                  </div>
                </div>

                {!isPro ? null : !isFormValid ? (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha o Produtor / Cliente para emitir o Laudo.
                  </div>
                ) : null}
              </div>

              {/* Detalhamento e Gráfico SVG */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-neutral-850 text-base">
                    Índice de Perdas Tolerável (Embrapa)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Gráfico SVG de composição (rosca com limite) */}
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
                          strokeDasharray={`${pctDentro} ${100 - pctDentro}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3.2"
                          strokeDasharray={`${pctExcedente} ${100 - pctExcedente}`}
                          strokeDashoffset={`-${pctDentro}`}
                        />
                        <text
                          x="18"
                          y="18"
                          fontFamily="sans-serif"
                          fontSize="3.5"
                          fontWeight="800"
                          fill="#262626"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform="rotate(90 18 18)"
                        >
                          {dentroDoLimite ? "OK" : "ALTO"}
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Legendas */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex justify-between items-center p-2 rounded bg-emerald-50 border border-emerald-100 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-emerald-900">Perda Admissível</span>
                      </div>
                      <span className="font-bold text-emerald-900">
                        {limiteToleravel} kg/ha
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-red-50 border border-red-100 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                        <span className="font-medium text-red-900">Carga Excedente</span>
                      </div>
                      <span className="font-bold text-red-900">
                        {Math.max(0, perdaKgHa - limiteToleravel).toFixed(1)} kg/ha
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Memória de Cálculo Agronômico (Ocupa 12 colunas au final) */}
        <div className="lg:col-span-12 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-neutral-800 flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-emerald-800" />
            Memória de Cálculo de Perda de Grãos
          </h3>
          <div className="text-sm text-neutral-600 space-y-4 leading-relaxed">
            <p>
              A avaliação física consiste em determinar a densidade de grãos caídos por metro quadrado no solo logo após a passagem da colhedora da cultura selecionada.
            </p>

            <div className="bg-neutral-50 p-4 rounded-xl space-y-3 font-mono text-xs text-neutral-700">
              <div>
                <span className="text-emerald-800 font-bold block mb-1">1. Densidade de Grãos (grãos/m²):</span>
                Densidade = Grãos Coletados / Área do Aro
                <br />
                Densidade = {graosAmostrados} grãos / {areaAro} m² = {graosPorM2.toFixed(1)} grãos/m²
              </div>
              
              <div className="pt-3 border-t border-neutral-200">
                <span className="text-blue-800 font-bold block mb-1">2. Perda Estimada por Hectare (kg/ha):</span>
                Perda (kg/ha) = (Densidade * Peso Unitário do Grão em gramas * 10.000 m²) / 1000
                <br />
                Peso Unitário (PMG / 1000) = {pesoMilGraos}g / 1000 = {pesoGraoG.toFixed(3)}g
                <br />
                Perda (kg/ha) = {graosPorM2.toFixed(2)} * {pesoGraoG.toFixed(3)} * 10 = {perdaKgHa.toFixed(2)} kg/ha
              </div>

              <div className="pt-3 border-t border-neutral-200">
                <span className="text-purple-800 font-bold block mb-1">3. Classificação Relativa (Embrapa):</span>
                - Limite tolerável: &lt;= {limiteToleravel} kg/ha (cerca de {(limiteToleravel/60).toFixed(1)} sc/ha)
                <br />
                Situação: {perdaKgHa.toFixed(1)} kg/ha ({dentroDoLimite ? "Dentro do aceitável" : "Acima do tolerável, necessita regulagem do picador/peneiras"})
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
          <div id="pdf-content" className="w-[210mm] bg-white text-neutral-900 p-10 font-sans print-only-container min-h-[270mm] flex flex-col">
            
            {/* Header do Laudo */}
            <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-6 mb-8">
              <div>
                <h1 className="text-2xl font-black text-emerald-800 tracking-tighter">
                  Talhão<span className="text-neutral-800">Digital</span>
                </h1>
                <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest mt-1">
                  Laudos e Diagnósticos Agronômicos de Precisão
                </p>
              </div>
              <div className="text-right text-[10px] text-neutral-500">
                <p suppressHydrationWarning><span className="font-bold text-neutral-800">Data:</span> {new Date().toLocaleDateString("pt-BR")}</p>
                <p suppressHydrationWarning><span className="font-bold text-neutral-800">Cód:</span> PER-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
              </div>
            </div>

            {/* Identificação */}
            <div className="grid grid-cols-2 gap-4 mb-8 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <div>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Responsável Técnico</p>
                <p className="font-bold text-neutral-800 text-sm uppercase">{responsavel || "Não informado"}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Produtor / Cliente</p>
                <p className="font-bold text-neutral-800 text-sm uppercase">{cliente || "Não informado"}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-neutral-800 border-b pb-2 mb-6">
              Diagnóstico de Perda de Grãos na Colheita Mecanizada
            </h2>

            {/* Grid de Tabelas */}
            <div className="grid grid-cols-12 gap-6 items-center">
              <div className="col-span-8 space-y-6">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700">
                      <th className="p-2 font-bold">Variável de Amostragem</th>
                      <th className="p-2 font-bold text-right">Informado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr><td className="p-2">Cultura Analisada</td><td className="p-2 text-right font-bold uppercase">{cultura}</td></tr>
                    <tr><td className="p-2">Largura da Plataforma da Colhedora</td><td className="p-2 text-right font-bold">{larguraPlataforma} m</td></tr>
                    <tr><td className="p-2">Grãos Coletados na Área do Aro</td><td className="p-2 text-right font-bold">{graosAmostrados} grãos</td></tr>
                    <tr><td className="p-2">Área Útil do Aro de Amostragem</td><td className="p-2 text-right font-bold">{areaAro} m²</td></tr>
                    <tr><td className="p-2">Peso Médio de 1000 Grãos (PMG)</td><td className="p-2 text-right font-bold">{pesoMilGraos} g</td></tr>
                  </tbody>
                </table>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-800">
                      <th className="p-2 font-bold">Métrica de Perda Estimada</th>
                      <th className="p-2 font-bold text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    <tr>
                      <td className="p-2">Densidade Média de Grãos no Solo</td>
                      <td className="p-2 text-right font-bold">{graosPorM2.toFixed(1)} grãos/m²</td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td className="p-2 font-bold text-emerald-950">Perda Total em Peso</td>
                      <td className="p-2 text-right font-bold text-emerald-950 text-sm">{perdaKgHa.toFixed(1)} kg/ha</td>
                    </tr>
                    <tr>
                      <td className="p-2">Perda Total em Sacas (60kg)</td>
                      <td className="p-2 text-right font-bold text-neutral-900">{perdaScHa.toFixed(2)} sc/ha</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rosca no PDF */}
              <div className="col-span-4 flex flex-col items-center justify-center border border-neutral-100 rounded-xl p-3 bg-neutral-50/30">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block text-center">Desvio do Limite</span>
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.2" strokeDasharray={`${pctDentro} ${100 - pctDentro}`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.2" strokeDasharray={`${pctExcedente} ${100 - pctExcedente}`} strokeDashoffset={`-${pctDentro}`} />
                    <text
                      x="18"
                      y="18"
                      fontFamily="sans-serif"
                      fontSize="4"
                      fontWeight="850"
                      fill="#065f46"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform="rotate(90 18 18)"
                    >
                      {dentroDoLimite ? "OK" : "ALTO"}
                    </text>
                  </svg>
                </div>
                
                {/* Legendas dos bicos no PDF */}
                <div className="mt-3 space-y-1 text-[8px] text-neutral-600 w-full">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Aceitável:</span>
                    </div>
                    <span className="font-bold text-neutral-850">{limiteToleravel} kg/ha</span>
                  </div>
                  <div className="flex justify-between items-center p-1 rounded bg-red-55 border border-red-100">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <span className="text-red-950">Excesso:</span>
                    </div>
                    <span className="font-bold text-red-950">{Math.max(0, perdaKgHa - limiteToleravel).toFixed(1)} kg/ha</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-neutral-55 border border-neutral-200 rounded-xl text-[10px] text-neutral-600 leading-relaxed font-mono">
              <strong>Laudo e Diagnóstico Operacional:</strong>
              <br />
              {dentroDoLimite ? (
                "O nível de perdas verificado na amostragem de campo encontra-se abaixo do limite operacional de tolerância estabelecido pela Embrapa. O conjunto colhedora/plataforma está operando de forma regulada."
              ) : (
                "Atenção: O nível de perdas ultrapassa o limite tolerável. Recomenda-se realizar ajustes e calibrações urgentes na colhedora, tais como: velocidade de deslocamento, rotação do cilindro batedor/rotor, abertura do côncavo ou regulagem da abertura das peneiras."
              )}
            </div>

            <div className="mt-auto pt-8 flex justify-between items-center text-[9px] text-neutral-400 font-medium">
              <p>Documento gerado digitalmente pela plataforma Talhão Digital.</p>
              <p>www.talhaodigital.com.br</p>
            </div>
          </div>
        </div>
      )}

      {/* Estilo para impressão local */}
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
