"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Scale, Dna } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface QuadradoPearsonClientProps {
  isPro: boolean;
  userName?: string;
}

type ExigenciaPreset = "vaca_leite_16" | "corte_cria_10" | "corte_recria_12" | "corte_engorda_14" | "suino_crescimento_16" | "ave_postura_17" | "manual";
type IngredienteAPreset = "farelo_soja" | "farelo_algodao" | "caroco_algodao" | "manual_a";
type IngredienteBPreset = "milho_moido" | "farelo_trigo" | "polpa_citrica" | "silagem_milho" | "capim_picado" | "manual_b";

const EXIGENCIAS: Record<ExigenciaPreset, { nome: string; pb: number }> = {
  vaca_leite_16: { nome: "Vacas em Lactação (16% PB)", pb: 16 },
  corte_cria_10: { nome: "Bovinos Corte - Cria (10% PB)", pb: 10 },
  corte_recria_12: { nome: "Bovinos Corte - Recria (12% PB)", pb: 12 },
  corte_engorda_14: { nome: "Bovinos Corte - Engorda (14% PB)", pb: 14 },
  suino_crescimento_16: { nome: "Suínos em Crescimento (16% PB)", pb: 16 },
  ave_postura_17: { nome: "Aves de Postura (17% PB)", pb: 17 },
  manual: { nome: "Personalizado / Inserir Manual", pb: 15 },
};

const INGREDIENTES_A: Record<IngredienteAPreset, { nome: string; pb: number }> = {
  farelo_soja: { nome: "Farelo de Soja", pb: 45 },
  farelo_algodao: { nome: "Farelo de Algodão", pb: 38 },
  caroco_algodao: { nome: "Caroço de Algodão", pb: 22 },
  manual_a: { nome: "Ingrediente Proteico Manual", pb: 40 },
};

const INGREDIENTES_B: Record<IngredienteBPreset, { nome: string; pb: number }> = {
  milho_moido: { nome: "Milho Moído", pb: 9 },
  farelo_trigo: { nome: "Farelo de Trigo", pb: 15 },
  polpa_citrica: { nome: "Polpa Cítrica", pb: 6 },
  silagem_milho: { nome: "Silagem de Milho", pb: 7 },
  capim_picado: { nome: "Capim Picado", pb: 8 },
  manual_b: { nome: "Ingrediente Energético Manual", pb: 10 },
};

export default function QuadradoPearsonClient({ isPro, userName }: QuadradoPearsonClientProps) {
  // Configuração Alvo
  const [exigenciaPreset, setExigenciaPreset] = useState<ExigenciaPreset>("vaca_leite_16");
  const [pbAlvo, setPbAlvo] = useState<number>(16);

  // Ingrediente A (Concentrado/Proteico)
  const [ingAPreset, setIngAPreset] = useState<IngredienteAPreset>("farelo_soja");
  const [ingANome, setIngANome] = useState<string>("Farelo de Soja");
  const [ingAPb, setIngAPb] = useState<number>(45);

  // Ingrediente B (Energético/Volumoso)
  const [ingBPreset, setIngBPreset] = useState<IngredienteBPreset>("milho_moido");
  const [ingBNome, setIngBNome] = useState<string>("Milho Moído");
  const [ingBPb, setIngBPb] = useState<number>(9);

  // Mistura Total
  const [misturaTotal, setMisturaTotal] = useState<number>(1000); // kg

  // Identificação do Laudo
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");
  const [showValidationError, setShowValidationError] = useState<boolean>(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // ======================================================
  // LÓGICA E CÁLCULOS DO PEARSOM SQUARE
  // ======================================================
  const pbMin = Math.min(ingAPb, ingBPb);
  const pbMax = Math.max(ingAPb, ingBPb);
  const possivel = pbAlvo > pbMin && pbAlvo < pbMax;

  // Diagonal Subtraction (absolute differences)
  const partesA = Math.abs(ingBPb - pbAlvo); // Diagonally opposite: Ing B PB - PB Alvo
  const partesB = Math.abs(ingAPb - pbAlvo); // Diagonally opposite: Ing A PB - PB Alvo
  const totalPartes = partesA + partesB;

  const pctA = totalPartes > 0 ? (partesA / totalPartes) * 100 : 0;
  const pctB = totalPartes > 0 ? (partesB / totalPartes) * 100 : 0;

  const massaA = (pctA / 100) * misturaTotal;
  const massaB = (pctB / 100) * misturaTotal;

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "";

  // ======================================================
  // GERAÇÃO DE PDF E IMPRESSÃO
  // ======================================================
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
      pdf.save(`Pearson-Racao-${cliente || "Laudo"}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  // ======================================================
  // DIAGRAMA SVG DO PEARSOM SQUARE
  // ======================================================
  const renderSvgQuadrado = () => {
    const size = 260;
    const padding = 40;
    const boxW = 55;
    const boxH = 30;

    // Coordenadas dos cantos do quadrado
    const topL = { x: padding, y: padding };
    const botL = { x: padding, y: size - padding };
    const topR = { x: size - padding, y: padding };
    const botR = { x: size - padding, y: size - padding };
    const center = { x: size / 2, y: size / 2 };

    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] mx-auto">
        {/* Linhas diagonais cruzadas */}
        <line x1={topL.x} y1={topL.y} x2={botR.x} y2={botR.y} stroke="#6b7280" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1={botL.x} y1={botL.y} x2={topR.x} y2={topR.y} stroke="#6b7280" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Canto Superior Esquerdo: Ingrediente A */}
        <rect x={topL.x - boxW / 2} y={topL.y - boxH / 2} width={boxW} height={boxH} rx="4" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
        <text x={topL.x} y={topL.y - 2} textAnchor="middle" className="text-[7px] font-bold fill-sky-950 truncate max-w-[45px]">{ingANome}</text>
        <text x={topL.x} y={topL.y + 8} textAnchor="middle" className="text-[9px] font-extrabold fill-sky-800">{ingAPb}% PB</text>

        {/* Canto Inferior Esquerdo: Ingrediente B */}
        <rect x={botL.x - boxW / 2} y={botL.y - boxH / 2} width={boxW} height={boxH} rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
        <text x={botL.x} y={botL.y - 2} textAnchor="middle" className="text-[7px] font-bold fill-amber-950">{ingBNome}</text>
        <text x={botL.x} y={botL.y + 8} textAnchor="middle" className="text-[9px] font-extrabold fill-amber-800">{ingBPb}% PB</text>

        {/* Centro do Quadrado: Meta de Proteína */}
        <circle cx={center.x} cy={center.y} r="22" fill="#047857" stroke="#064e3b" strokeWidth="2" />
        <text x={center.x} y={center.y - 2} textAnchor="middle" className="text-[7px] font-bold fill-emerald-100 uppercase tracking-wider">Meta</text>
        <text x={center.x} y={center.y + 8} textAnchor="middle" className="text-[10px] font-extrabold fill-white">{pbAlvo}% PB</text>

        {/* Canto Superior Direito: Partes do Ingrediente A (calculado da diferença com B) */}
        <rect x={topR.x - boxW / 2} y={topR.y - boxH / 2} width={boxW} height={boxH} rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
        <text x={topR.x} y={topR.y - 2} textAnchor="middle" className="text-[7px] font-bold fill-emerald-950">Partes de A</text>
        <text x={topR.x} y={topR.y + 8} textAnchor="middle" className="text-[9px] font-extrabold fill-emerald-700">{possivel ? partesA.toFixed(1) : "0"}</text>

        {/* Canto Inferior Direito: Partes do Ingrediente B (calculado da diferença com A) */}
        <rect x={botR.x - boxW / 2} y={botR.y - boxH / 2} width={boxW} height={boxH} rx="4" fill="#fcf7ff" stroke="#a855f7" strokeWidth="1.5" />
        <text x={botR.x} y={botR.y - 2} textAnchor="middle" className="text-[7px] font-bold fill-purple-950">Partes de B</text>
        <text x={botR.x} y={botR.y + 8} textAnchor="middle" className="text-[9px] font-extrabold fill-purple-700">{possivel ? partesB.toFixed(1) : "0"}</text>
      </svg>
    );
  };

  // ======================================================
  // GRÁFICO DE ROSCA SVG (COMPOSIÇÃO RAÇÃO)
  // ======================================================
  const renderDonut = () => {
    const size = 144;
    const cx = size / 2;
    const cy = size / 2;
    const r = 52;
    const circ = 2 * Math.PI * r;
    const dashPreenchido = possivel ? (pctA / 100) * circ : 0;
    const dashVazio = circ - dashPreenchido;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#a855f7" strokeWidth="18" /> {/* Ingrediente B */}
        {possivel && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="#10b981" strokeWidth="18" // Ingrediente A
            strokeDasharray={`${dashPreenchido} ${dashVazio}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-lg font-extrabold" fill="#047857">{possivel ? pbAlvo : "0"}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="text-[9px]" fill="#6b7280">PB Alvo</text>
      </svg>
    );
  };

  return (
    <div className={`min-h-screen bg-neutral-50/50 flex flex-col ${!isPro ? "select-none" : ""}`} onContextMenu={(e) => !isPro && e.preventDefault()}>
      <div className="no-print">
        <Header />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 no-print">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/ferramentas/quebra-umidade" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-emerald-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar às Ferramentas
          </Link>
        </div>

        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Balanceador de Ração (Pearson)</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Formulação de Ração pelo Quadrado de Pearson — Pecuária & Silagem</p>
            </div>
          </div>

          {/* Botões PDF / Imprimir */}
          <div className="flex items-center gap-3 w-full md:w-auto mt-4">
            {isPro ? (
              <>
                <button
                  onClick={handleImprimir}
                  disabled={!isFormValid || !possivel}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={handleGerarPdf}
                  disabled={!isFormValid || !possivel || gerandoPdf}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gerandoPdf ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {gerandoPdf ? "Gerando..." : "Exportar PDF"}
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
                  Exportar PDF
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Banner Pro CTA */}
        {!isPro && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start mb-6">
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
          
          {/* ============================================ */}
          {/* COLUNA ESQUERDA: INPUTS (7 colunas)          */}
          {/* ============================================ */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Bloco 1: Meta de Proteína */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">1. Exigência do Animal (Meta)</h2>
                <p className="text-xs text-neutral-500 mt-1">Determine a porcentagem de Proteína Bruta (PB) requerida na mistura</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Preset de Categoria</label>
                  <select
                    value={exigenciaPreset}
                    onChange={(e) => {
                      const val = e.target.value as ExigenciaPreset;
                      setExigenciaPreset(val);
                      if (val !== "manual") {
                        setPbAlvo(EXIGENCIAS[val].pb);
                      }
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    {Object.entries(EXIGENCIAS).map(([key, ex]) => (
                      <option key={key} value={key}>{ex.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Meta de Proteína Bruta (% PB)</label>
                  <input
                    type="number"
                    value={pbAlvo}
                    onChange={(e) => {
                      setPbAlvo(Number(e.target.value));
                      setExigenciaPreset("manual");
                    }}
                    min={1}
                    max={100}
                    step={0.1}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Ingredientes */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">2. Ingredientes da Mistura</h2>
                <p className="text-xs text-neutral-500 mt-1">Insira os teores de Proteína Bruta (% PB) de cada ingrediente</p>
              </div>

              {/* Ingrediente A (Proteico) */}
              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 space-y-3">
                <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider">Ingrediente A (Proteico / Maior PB)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">Escolha Rápida</label>
                    <select
                      value={ingAPreset}
                      onChange={(e) => {
                        const val = e.target.value as IngredienteAPreset;
                        setIngAPreset(val);
                        if (val !== "manual_a") {
                          setIngANome(INGREDIENTES_A[val].nome);
                          setIngAPb(INGREDIENTES_A[val].pb);
                        }
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    >
                      {Object.entries(INGREDIENTES_A).map(([key, ing]) => (
                        <option key={key} value={key}>{ing.nome} ({ing.pb}%)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">Nome do Alimento</label>
                    <input
                      type="text"
                      value={ingANome}
                      onChange={(e) => {
                        setIngANome(e.target.value);
                        setIngAPreset("manual_a");
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">Teor PB (% PB)</label>
                    <input
                      type="number"
                      value={ingAPb}
                      onChange={(e) => {
                        setIngAPb(Number(e.target.value));
                        setIngAPreset("manual_a");
                      }}
                      min={0}
                      max={100}
                      step={0.1}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Ingrediente B (Energético / Menor PB) */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Ingrediente B (Energético / Menor PB)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">Escolha Rápida</label>
                    <select
                      value={ingBPreset}
                      onChange={(e) => {
                        const val = e.target.value as IngredienteBPreset;
                        setIngBPreset(val);
                        if (val !== "manual_b") {
                          setIngBNome(INGREDIENTES_B[val].nome);
                          setIngBPb(INGREDIENTES_B[val].pb);
                        }
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    >
                      {Object.entries(INGREDIENTES_B).map(([key, ing]) => (
                        <option key={key} value={key}>{ing.nome} ({ing.pb}%)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">Nome do Alimento</label>
                    <input
                      type="text"
                      value={ingBNome}
                      onChange={(e) => {
                        setIngBNome(e.target.value);
                        setIngBPreset("manual_b");
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">Teor PB (% PB)</label>
                    <input
                      type="number"
                      value={ingBPb}
                      onChange={(e) => {
                        setIngBPb(Number(e.target.value));
                        setIngBPreset("manual_b");
                      }}
                      min={0}
                      max={100}
                      step={0.1}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3: Volume Desejado */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">3. Volume Total de Mistura</h2>
                <p className="text-xs text-neutral-500 mt-1">Informe a escala da batida da ração em kg</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Quantidade Desejada (kg)</label>
                <input
                  type="number"
                  value={misturaTotal}
                  onChange={(e) => setMisturaTotal(Number(e.target.value))}
                  min={1}
                  step={10}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold"
                />
              </div>
            </div>

            {/* Bloco 4: Laudo Técnico */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Laudo Técnico</h2>
                <p className="text-xs text-neutral-500 mt-1">Identificação para emissão do relatório</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Responsável Técnico</label>
                  <input
                    type="text"
                    value={responsavel}
                    readOnly
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-100 text-neutral-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Produtor / Cliente</label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => {
                      setCliente(e.target.value);
                      if (showValidationError && e.target.value.trim() !== "") setShowValidationError(false);
                    }}
                    placeholder="Nome do produtor ou empresa"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ============================================ */}
          {/* COLUNA DIREITA: RESULTADOS (5 colunas)       */}
          {/* ============================================ */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6 self-start">
            
            {/* Hero Card */}
            <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-900/50 rounded-full blur-2xl" />
              
              <div className="relative z-10">
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">Composição da Mistura</p>
                
                {possivel ? (
                  <div className="space-y-4">
                    <div className="border-b border-emerald-900 pb-3">
                      <p className="text-xs text-emerald-400 font-semibold">{ingANome} ({pctA.toFixed(1)}%)</p>
                      <p className="text-3xl font-extrabold tracking-tight">
                        {massaA.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} <span className="text-lg font-bold">kg</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-400 font-semibold">{ingBNome} ({pctB.toFixed(1)}%)</p>
                      <p className="text-3xl font-extrabold tracking-tight">
                        {massaB.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} <span className="text-lg font-bold">kg</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-red-200">
                    <p className="text-lg font-extrabold">⚠️ Formulação Inviável</p>
                    <p className="text-xs text-red-300 mt-2 leading-relaxed">
                      A proteína alvo ({pbAlvo}%) deve estar obrigatoriamente compreendida entre a do ingrediente de menor valor ({pbMin}%) e o de maior valor ({pbMax}%).
                    </p>
                  </div>
                )}

                {/* Mensagens de erro/validação */}
                {!isPro ? null : !isFormValid ? (
                  <div className="mt-4 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha o Produtor / Cliente para emitir o Laudo.
                  </div>
                ) : null}
              </div>
            </div>

            {/* Card Detalhamento Técnico */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-6">
              <div>
                <h3 className="font-bold text-sm text-neutral-800 mb-4">Quadrado de Pearson</h3>
                <div className="bg-neutral-50 rounded-xl p-4 flex justify-center">
                  {renderSvgQuadrado()}
                </div>
              </div>

              {possivel && (
                <div>
                  <h4 className="font-bold text-xs text-neutral-600 uppercase tracking-wider mb-3 text-center">Partição da Ração</h4>
                  {renderDonut()}
                  <div className="flex justify-center gap-6 mt-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> {ingANome} ({pctA.toFixed(1)}%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> {ingBNome} ({pctB.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ============================================ */}
        {/* MEMÓRIA DE CÁLCULO (12 colunas)             */}
        {/* ============================================ */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <h2 className="font-bold text-lg text-neutral-800 mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Memória de Cálculo — Quadrado de Pearson
          </h2>
          <div className="font-mono text-xs text-neutral-700 space-y-4 bg-neutral-50 rounded-xl p-5">
            <div>
              <span className="text-emerald-800 font-bold block mb-1">1. Lógica do Balanceamento</span>
              <p>O Quadrado de Pearson baseia-se na diferença absoluta cruzada diagonal entre a concentração nutricional de dois ingredientes e o teor alvo desejado.</p>
            </div>

            {possivel ? (
              <>
                <div className="pt-2 border-t border-neutral-200">
                  <span className="font-bold text-neutral-800 block">Diferenças Absolutas (Partes):</span>
                  Partes de {ingANome} (A) = |PB do {ingBNome} - PB Alvo|
                  <br />
                  Partes de A = |{ingBPb} - {pbAlvo}| = <span className="font-bold text-emerald-700">{partesA.toFixed(2)} partes</span>
                  <br />
                  <br />
                  Partes de {ingBNome} (B) = |PB do {ingANome} - PB Alvo|
                  <br />
                  Partes de B = |{ingAPb} - {pbAlvo}| = <span className="font-bold text-purple-700">{partesB.toFixed(2)} partes</span>
                  <br />
                  <br />
                  Total de Partes = Partes de A + Partes de B
                  <br />
                  Total de Partes = {partesA.toFixed(2)} + {partesB.toFixed(2)} = <span className="font-bold">{totalPartes.toFixed(2)} partes</span>
                </div>

                <div className="pt-2 border-t border-neutral-200">
                  <span className="font-bold text-neutral-800 block">Proporções Percentuais (%):</span>
                  Proporção de A (%) = (Partes de A / Total de Partes) × 100
                  <br />
                  Proporção de A (%) = ({partesA.toFixed(2)} / {totalPartes.toFixed(2)}) × 100 = <span className="font-bold text-emerald-700">{pctA.toFixed(2)}%</span>
                  <br />
                  <br />
                  Proporção de B (%) = (Partes de B / Total de Partes) × 100
                  <br />
                  Proporção de B (%) = ({partesB.toFixed(2)} / {totalPartes.toFixed(2)}) × 100 = <span className="font-bold text-purple-700">{pctB.toFixed(2)}%</span>
                </div>

                <div className="pt-2 border-t border-neutral-200">
                  <span className="font-bold text-neutral-800 block">Massa Requerida por Batida (kg):</span>
                  Massa de {ingANome} = (Proporção de A / 100) × Mistura Total
                  <br />
                  Massa de A = ({pctA.toFixed(4)} / 100) × {misturaTotal} = <span className="font-bold text-emerald-700">{massaA.toFixed(1)} kg</span>
                  <br />
                  <br />
                  Massa de {ingBNome} = (Proporção de B / 100) × Mistura Total
                  <br />
                  Massa de B = ({pctB.toFixed(4)} / 100) × {misturaTotal} = <span className="font-bold text-purple-700">{massaB.toFixed(1)} kg</span>
                </div>
              </>
            ) : (
              <div className="text-red-600 font-bold">
                Cálculo indisponível. Ajuste os teores de proteína dos ingredientes e a meta para que a formulação seja viável.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="no-print"><Footer /></div>

      {/* ============================================================= */}
      {/* ----------------- ESTRUTURA PARA PDF/PRINT ------------------- */}
      {/* ============================================================= */}
      <div
        id="pdf-content"
        style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm", background: "#fff", fontFamily: "sans-serif" }}
        className="text-neutral-800"
      >
        <div className="flex flex-col" style={{ minHeight: "270mm" }}>
          {/* Cabeçalho do Laudo */}
          <div className="text-center border-b-2 border-emerald-800 pb-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-emerald-900">TalhãoDigital</h1>
            <p className="text-xs text-neutral-500 mt-2">Laudos e Diagnósticos Agronômicos de Precisão</p>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-extrabold text-neutral-800 text-center">
              Laudo de Formulação de Ração (Pearson)
            </h2>
            <p className="text-xs text-neutral-500 text-center mt-1">
              Emitido em {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Conteúdo em duas colunas */}
          <div className="grid grid-cols-2 gap-6 mt-6 flex-1">
            {/* Tabela de Parâmetros e Resultados */}
            <div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="p-2 text-left font-bold text-emerald-900 border border-emerald-200">Parâmetro</th>
                    <th className="p-2 text-right font-bold text-emerald-900 border border-emerald-200">Valor / Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-neutral-200">Meta de Proteína Bruta</td><td className="p-2 text-right font-bold border border-neutral-200">{pbAlvo}% PB</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Ingrediente A (Proteico)</td><td className="p-2 text-right font-bold border border-neutral-200">{ingANome} ({ingAPb}% PB)</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Ingrediente B (Energético)</td><td className="p-2 text-right font-bold border border-neutral-200">{ingBNome} ({ingBPb}% PB)</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Mistura Total Desejada</td><td className="p-2 text-right font-bold border border-neutral-200">{misturaTotal.toLocaleString("pt-BR")} kg</td></tr>
                  
                  {possivel ? (
                    <>
                      <tr className="bg-emerald-50"><td className="p-2 border border-emerald-200 font-bold">Quantidade de {ingANome}</td><td className="p-2 text-right font-extrabold text-emerald-800 border border-emerald-200">{massaA.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg ({pctA.toFixed(1)}%)</td></tr>
                      <tr className="bg-purple-50"><td className="p-2 border border-purple-200 font-bold">Quantidade de {ingBNome}</td><td className="p-2 text-right font-extrabold text-purple-800 border border-purple-200">{massaB.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg ({pctB.toFixed(1)}%)</td></tr>
                    </>
                  ) : (
                    <tr className="bg-red-50"><td className="p-2 border border-red-200 font-bold text-red-700" colSpan={2}>Formulação Inválida / Impossível</td></tr>
                  )}

                  <tr><td className="p-2 border border-neutral-200">Responsável Técnico</td><td className="p-2 text-right font-bold border border-neutral-200">{responsavel}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Produtor / Cliente</td><td className="p-2 text-right font-bold border border-neutral-200">{cliente}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Diagrama Visual */}
            <div className="flex flex-col items-center justify-start pt-4">
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Diagrama do Quadrado</h3>
              <div className="w-full max-w-[240px]">
                {renderSvgQuadrado()}
              </div>
              {possivel && (
                <div className="mt-6 w-36 h-36">
                  {renderDonut()}
                </div>
              )}
            </div>
          </div>

          {/* Rodapé do Laudo */}
          <div className="mt-auto border-t border-neutral-300 pt-3 text-center text-[9px] text-neutral-400">
            <p>TalhãoDigital — Laudos e Diagnósticos Agronômicos de Precisão</p>
            <p>Este documento foi gerado automaticamente e não possui valor jurídico sem a devida assinatura do responsável técnico.</p>
          </div>
        </div>
      </div>

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
