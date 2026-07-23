"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Scale, BarChart2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PontoEquilibrioClientProps {
  isPro: boolean;
  userName?: string;
}

type CropPreset = "soja" | "milho" | "trigo" | "algodao" | "arroz" | "feijao" | "sorgo" | "cafe" | "cana" | "manual";

interface CropData {
  produtividade: number;
  precoSaca: number;
  sementes: number;
  fertilizantes: number;
  defensivos: number;
  combustivel: number;
  colheita: number;
  outrosVariaveis: number;
  maoDeObra: number;
  depreciacao: number;
  arrendamento: number;
  outrosFixos: number;
}

const PRESETS: Record<CropPreset, { nome: string; data: CropData }> = {
  soja: {
    nome: "Soja (Grãos - Presets Médios)",
    data: {
      produtividade: 60,
      precoSaca: 130,
      sementes: 950,
      fertilizantes: 1750,
      defensivos: 1100,
      combustivel: 350,
      colheita: 250,
      outrosVariaveis: 100,
      maoDeObra: 450,
      depreciacao: 350,
      arrendamento: 600,
      outrosFixos: 150,
    },
  },
  milho: {
    nome: "Milho (Safra/Safrinha - Presets Médios)",
    data: {
      produtividade: 120,
      precoSaca: 60,
      sementes: 1150,
      fertilizantes: 2100,
      defensivos: 1050,
      combustivel: 450,
      colheita: 300,
      outrosVariaveis: 150,
      maoDeObra: 500,
      depreciacao: 400,
      arrendamento: 600,
      outrosFixos: 200,
    },
  },
  trigo: {
    nome: "Trigo (Cereal - Presets Médios)",
    data: {
      produtividade: 50,
      precoSaca: 78,
      sementes: 550,
      fertilizantes: 1150,
      defensivos: 750,
      combustivel: 280,
      colheita: 220,
      outrosVariaveis: 50,
      maoDeObra: 300,
      depreciacao: 250,
      arrendamento: 450,
      outrosFixos: 100,
    },
  },
  algodao: {
    nome: "Algodão (Fibras / Pluma - Presets Médios)",
    data: {
      produtividade: 280,
      precoSaca: 85, // R$/@
      sementes: 1800,
      fertilizantes: 4200,
      defensivos: 3500,
      combustivel: 1200,
      colheita: 1500,
      outrosVariaveis: 800,
      maoDeObra: 1200,
      depreciacao: 1500,
      arrendamento: 2000,
      outrosFixos: 600,
    },
  },
  arroz: {
    nome: "Arroz (Cereal Irrigado - Presets Médios)",
    data: {
      produtividade: 140,
      precoSaca: 115,
      sementes: 900,
      fertilizantes: 2600,
      defensivos: 1800,
      combustivel: 950,
      colheita: 600,
      outrosVariaveis: 400,
      maoDeObra: 800,
      depreciacao: 1100,
      arrendamento: 1400,
      outrosFixos: 300,
    },
  },
  feijao: {
    nome: "Feijão (Leguminosa - Presets Médios)",
    data: {
      produtividade: 35,
      precoSaca: 275,
      sementes: 850,
      fertilizantes: 1500,
      defensivos: 1300,
      combustivel: 450,
      colheita: 350,
      outrosVariaveis: 150,
      maoDeObra: 500,
      depreciacao: 400,
      arrendamento: 800,
      outrosFixos: 200,
    },
  },
  sorgo: {
    nome: "Sorgo (Cereal - Presets Médios)",
    data: {
      produtividade: 80,
      precoSaca: 48,
      sementes: 450,
      fertilizantes: 1050,
      defensivos: 600,
      combustivel: 280,
      colheita: 200,
      outrosVariaveis: 50,
      maoDeObra: 300,
      depreciacao: 250,
      arrendamento: 450,
      outrosFixos: 100,
    },
  },
  cafe: {
    nome: "Café (Arábica Beneficiado - Presets Médios)",
    data: {
      produtividade: 32,
      precoSaca: 1150,
      sementes: 2200,
      fertilizantes: 4500,
      defensivos: 3800,
      combustivel: 1600,
      colheita: 3500,
      outrosVariaveis: 1200,
      maoDeObra: 4500,
      depreciacao: 2000,
      arrendamento: 3000,
      outrosFixos: 800,
    },
  },
  cana: {
    nome: "Cana-de-Açúcar (Toneladas - Presets Médios)",
    data: {
      produtividade: 85,
      precoSaca: 140, // R$/ton
      sementes: 1500,
      fertilizantes: 2400,
      defensivos: 1200,
      combustivel: 800,
      colheita: 1100,
      outrosVariaveis: 200,
      maoDeObra: 800,
      depreciacao: 1200,
      arrendamento: 1500,
      outrosFixos: 300,
    },
  },
  manual: {
    nome: "Personalizado / Inserir Manual",
    data: {
      produtividade: 60,
      precoSaca: 130,
      sementes: 0,
      fertilizantes: 0,
      defensivos: 0,
      combustivel: 0,
      colheita: 0,
      outrosVariaveis: 0,
      maoDeObra: 0,
      depreciacao: 0,
      arrendamento: 0,
      outrosFixos: 0,
    },
  },
};

export default function PontoEquilibrioClient({ isPro, userName }: PontoEquilibrioClientProps) {
  const [preset, setPreset] = useState<CropPreset>("soja");

  // Estados de Entrada (Custos por Hectare R$/ha e Produtividade)
  const [produtividade, setProdutividade] = useState<number>(PRESETS.soja.data.produtividade);
  const [precoSaca, setPrecoSaca] = useState<number>(PRESETS.soja.data.precoSaca);
  const [areaHa, setAreaHa] = useState<number>(10);

  // Custos Variáveis
  const [sementes, setSementes] = useState<number>(PRESETS.soja.data.sementes);
  const [fertilizantes, setFertilizantes] = useState<number>(PRESETS.soja.data.fertilizantes);
  const [defensivos, setDefensivos] = useState<number>(PRESETS.soja.data.defensivos);
  const [combustivel, setCombustivel] = useState<number>(PRESETS.soja.data.combustivel);
  const [colheita, setColheita] = useState<number>(PRESETS.soja.data.colheita);
  const [outrosVariaveis, setOutrosVariaveis] = useState<number>(PRESETS.soja.data.outrosVariaveis);

  // Custos Fixos
  const [maoDeObra, setMaoDeObra] = useState<number>(PRESETS.soja.data.maoDeObra);
  const [depreciacao, setDepreciacao] = useState<number>(PRESETS.soja.data.depreciacao);
  const [arrendamento, setArrendamento] = useState<number>(PRESETS.soja.data.arrendamento);
  const [outrosFixos, setOutrosFixos] = useState<number>(PRESETS.soja.data.outrosFixos);

  // Laudo Técnico
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");
  const [showValidationError, setShowValidationError] = useState<boolean>(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "";

  // ======================================================
  // PROCESSAMENTO DE CÁLCULOS
  // ======================================================
  const custoVariavelTotal = sementes + fertilizantes + defensivos + combustivel + colheita + outrosVariaveis;
  const custoFixoTotal = maoDeObra + depreciacao + arrendamento + outrosFixos;
  const custoTotalHa = custoVariavelTotal + custoFixoTotal;

  const receitaBrutaHa = produtividade * precoSaca;
  const margemHa = receitaBrutaHa - custoVariavelTotal;
  const margemPct = receitaBrutaHa > 0 ? (margemHa / receitaBrutaHa) * 100 : 0;

  const custoVariavelSaca = produtividade > 0 ? custoVariavelTotal / produtividade : 0;
  const margemSaca = precoSaca - custoVariavelSaca;

  // Ponto de Equilíbrio em sacas/ha (PE = CF / Margem_Saca)
  const peSacas = margemSaca > 0 ? custoFixoTotal / margemSaca : 0;
  const peReais = peSacas * precoSaca;

  // Preço de Equilíbrio (preço mínimo por saca para cobrir custo total)
  const precoEquilibrio = produtividade > 0 ? custoTotalHa / produtividade : 0;

  // Margem de Segurança
  const margemSegurancaSacas = produtividade - peSacas;
  const margemSegurancaPct = produtividade > 0 ? (margemSegurancaSacas / produtividade) * 100 : 0;

  const temPrejuizo = margemSegurancaSacas < 0;

  // ======================================================
  // APLICAÇÃO DE PRESETS
  // ======================================================
  const handlePresetChange = (pKey: CropPreset) => {
    setPreset(pKey);
    const pData = PRESETS[pKey].data;
    setProdutividade(pData.produtividade);
    setPrecoSaca(pData.precoSaca);
    setSementes(pData.sementes);
    setFertilizantes(pData.fertilizantes);
    setDefensivos(pData.defensivos);
    setCombustivel(pData.combustivel);
    setColheita(pData.colheita);
    setOutrosVariaveis(pData.outrosVariaveis);
    setMaoDeObra(pData.maoDeObra);
    setDepreciacao(pData.depreciacao);
    setArrendamento(pData.arrendamento);
    setOutrosFixos(pData.outrosFixos);
  };

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
      pdf.save(`Ponto-Equilibrio-${cliente || "Laudo"}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  // ======================================================
  // GRÁFICO CARTESIANO DE PONTO DE EQUILÍBRIO SVG
  // ======================================================
  const renderSvgGrafico = () => {
    const w = 240;
    const h = 130;
    const padL = 35;
    const padB = 20;
    const padT = 10;
    const padR = 10;

    const chartW = w - padL - padR;
    const chartH = h - padB - padT;

    // Definição de limites cartesianos (X = Sacas, Y = Reais)
    const maxX = Math.max(produtividade * 1.4, 40);
    const maxY = Math.max(receitaBrutaHa * 1.4, custoTotalHa * 1.4, 1500);

    const getX = (val: number) => padL + (val / maxX) * chartW;
    const getY = (val: number) => h - padB - (val / maxY) * chartH;

    // Coordenadas das linhas
    // Custo Fixo Line (Horizontal)
    const cfY = getY(custoFixoTotal);

    // Custo Total Line: (0, CF) -> (maxX, CF + maxX*custoVariavelSaca)
    const ctY0 = cfY;
    const ctYMax = getY(custoFixoTotal + maxX * custoVariavelSaca);

    // Receita Line: (0, 0) -> (maxX, maxX * precoSaca)
    const recY0 = getY(0);
    const recYMax = getY(maxX * precoSaca);

    // Ponto de Equilíbrio
    const peXCoord = getX(peSacas);
    const peYCoord = getY(peReais);

    // Área de Prejuízo (Polígono entre 0 e PE: Receita abaixo de Custo Total)
    const pathPrejuizo = `
      M ${getX(0)} ${recY0}
      L ${getX(0)} ${ctY0}
      L ${peXCoord} ${peYCoord}
      Z
    `;

    // Área de Lucro (Polígono entre PE e Produtividade máxima do gráfico)
    const pathLucro = `
      M ${peXCoord} ${peYCoord}
      L ${getX(maxX)} ${ctYMax}
      L ${getX(maxX)} ${recYMax}
      Z
    `;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full mx-auto font-mono text-[6px] fill-neutral-500">
        {/* Eixos */}
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#d1d5db" strokeWidth="1" />
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#d1d5db" strokeWidth="1" />

        {/* Áreas de Lucro e Prejuízo */}
        {peSacas > 0 && peSacas < maxX && (
          <>
            <path d={pathPrejuizo} fill="#ef4444" fillOpacity="0.1" />
            <path d={pathLucro} fill="#10b981" fillOpacity="0.1" />
          </>
        )}

        {/* Linha Custo Fixo */}
        <line x1={padL} y1={cfY} x2={w - padR} y2={cfY} stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="3 3" />

        {/* Linha Custo Total */}
        <line x1={padL} y1={ctY0} x2={w - padR} y2={ctYMax} stroke="#3b82f6" strokeWidth="1.2" />

        {/* Linha Receita */}
        <line x1={padL} y1={recY0} x2={w - padR} y2={recYMax} stroke="#10b981" strokeWidth="1.2" />

        {/* Marcador do Ponto de Equilíbrio */}
        {peSacas > 0 && peSacas < maxX && (
          <>
            <circle cx={peXCoord} cy={peYCoord} r="3" fill="#a855f7" />
            <line x1={peXCoord} y1={peYCoord} x2={peXCoord} y2={h - padB} stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1={padL} y1={peYCoord} x2={peXCoord} y2={peYCoord} stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2 2" />
          </>
        )}

        {/* Rótulos e Legendas de Linhas */}
        <text x={w - padR - 35} y={recYMax - 3} className="fill-emerald-700 font-bold">Receita</text>
        <text x={w - padR - 45} y={ctYMax - 3} className="fill-blue-700 font-bold">Custo Total</text>
        <text x={w - padR - 35} y={cfY - 3} className="fill-neutral-400">Custo Fixo</text>

        {/* Eixo X: Rótulos */}
        <text x={padL} y={h - padB + 10} textAnchor="middle">0</text>
        <text x={getX(produtividade)} y={h - padB + 10} textAnchor="middle" className="fill-neutral-700 font-bold">
          {produtividade} sc
        </text>
        {peSacas > 0 && peSacas < maxX && (
          <text x={peXCoord} y={h - padB + 15} textAnchor="middle" className="fill-purple-700 font-bold">
            {peSacas.toFixed(1)} sc/ha
          </text>
        )}
        <text x={w - padR} y={h - padB + 10} textAnchor="end">Sacas/ha</text>

        {/* Eixo Y: Rótulos */}
        <text x={padL - 4} y={cfY + 2} textAnchor="end">CF</text>
        {peSacas > 0 && peSacas < maxX && (
          <text x={padL - 4} y={peYCoord + 2} textAnchor="end" className="fill-purple-700">PE</text>
        )}
        <text x={padL - 4} y={padT + 5} textAnchor="end">R$/ha</text>
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
        <div className="no-print mb-6">
          <Link href="/ferramentas/quebra-umidade" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-emerald-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar às Ferramentas
          </Link>
        </div>

        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Margem de Contribuição e Ponto de Equilíbrio</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Custos Fixos e Variáveis, Viabilidade em Sacas/ha e Preço de Equilíbrio — Gestão Agrícola</p>
            </div>
          </div>

          {/* Botões PDF / Imprimir */}
          <div className="flex items-center gap-3 w-full md:w-auto mt-4">
            {isPro ? (
              <>
                <button
                  onClick={handleImprimir}
                  disabled={!isFormValid}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            
            {/* Bloco 1: Presets e Produtividade */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">1. Dados de Produção e Safra</h2>
                <p className="text-xs text-neutral-500 mt-1">Selecione o preset de cultura ou configure a meta de colheita</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Cultura Agrícola (Presets)</label>
                  <select
                    value={preset}
                    onChange={(e) => handlePresetChange(e.target.value as CropPreset)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-medium"
                  >
                    {Object.entries(PRESETS).map(([key, p]) => (
                      <option key={key} value={key}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Área da Lavoura (ha)</label>
                  <input
                    type="number"
                    value={areaHa}
                    onChange={(e) => setAreaHa(Number(e.target.value))}
                    min={0.1}
                    step={0.5}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Produtividade Alvo (Sacas / ha)</label>
                  <input
                    type="number"
                    value={produtividade}
                    onChange={(e) => {
                      setProdutividade(Number(e.target.value));
                      setPreset("manual");
                    }}
                    min={1}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Preço Praticado da Saca (R$ / sc)</label>
                  <input
                    type="number"
                    value={precoSaca}
                    onChange={(e) => {
                      setPrecoSaca(Number(e.target.value));
                      setPreset("manual");
                    }}
                    min={1}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-emerald-800"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Custos Variáveis (R$/ha) */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">2. Custos Variáveis (R$ / ha)</h2>
                <p className="text-xs text-neutral-500 mt-1">Custos proporcionais ao plantio e área cultivada</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Sementes / Mudas</label>
                  <input
                    type="number"
                    value={sementes}
                    onChange={(e) => { setSementes(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Fertilizantes / Adubos</label>
                  <input
                    type="number"
                    value={fertilizantes}
                    onChange={(e) => { setFertilizantes(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Defensivos / Agroquímicos</label>
                  <input
                    type="number"
                    value={defensivos}
                    onChange={(e) => { setDefensivos(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Combustível & Operações</label>
                  <input
                    type="number"
                    value={combustivel}
                    onChange={(e) => { setCombustivel(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Frete / Colheita / Armazenagem</label>
                  <input
                    type="number"
                    value={colheita}
                    onChange={(e) => { setColheita(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Outros Custos Variáveis</label>
                  <input
                    type="number"
                    value={outrosVariaveis}
                    onChange={(e) => { setOutrosVariaveis(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Custos Fixos (R$/ha) */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">3. Custos Fixos (R$ / ha)</h2>
                <p className="text-xs text-neutral-500 mt-1">Custos fixados independentemente do rendimento da lavoura</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">Mão de Obra Fixa</label>
                  <input
                    type="number"
                    value={maoDeObra}
                    onChange={(e) => { setMaoDeObra(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">Depreciação Máq.</label>
                  <input
                    type="number"
                    value={depreciacao}
                    onChange={(e) => { setDepreciacao(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">Arrendamento</label>
                  <input
                    type="number"
                    value={arrendamento}
                    onChange={(e) => { setArrendamento(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">Administração</label>
                  <input
                    type="number"
                    value={outrosFixos}
                    onChange={(e) => { setOutrosFixos(Number(e.target.value)); setPreset("manual"); }}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
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
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Ponto de Equilíbrio</p>
                <p className="text-4xl font-extrabold tracking-tight">
                  {peSacas.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  <span className="text-lg font-bold text-emerald-300 ml-1">sc / ha</span>
                </p>
                
                <p className="text-emerald-400 text-xs mt-1">
                  Receita Mínima Necessária: <span className="font-bold text-white">R$ {peReais.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} / ha</span>
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-emerald-900">
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Margem Contribuição</p>
                    <p className="text-lg font-extrabold text-white">
                      R$ {margemHa.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/ha
                    </p>
                    <p className="text-[10px] text-emerald-300 font-medium">
                      Equivale a {margemPct.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Preço de Equilíbrio</p>
                    <p className="text-lg font-extrabold text-white">
                      R$ {precoEquilibrio.toFixed(2)}/sc
                    </p>
                    <p className="text-[10px] text-emerald-300 font-medium">
                      Preço mínimo da saca
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-900">
                  <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Margem de Segurança</p>
                  <p className={`text-sm font-bold mt-1 ${temPrejuizo ? "text-red-300" : "text-emerald-200"}`}>
                    {temPrejuizo 
                      ? `⚠️ Prejuízo! Faltam ${Math.abs(margemSegurancaSacas).toFixed(1)} sc/ha` 
                      : `✓ Segura! Sobram ${margemSegurancaSacas.toFixed(1)} sc/ha (+${margemSegurancaPct.toFixed(1)}%)`}
                  </p>
                </div>

                {/* Mensagens de erro/validação */}
                {!isPro ? null : !isFormValid ? (
                  <div className="mt-4 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha o Produtor / Cliente para emitir o Laudo.
                  </div>
                ) : null}
              </div>
            </div>

            {/* Card Detalhamento Técnico */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
              <h3 className="font-bold text-sm text-neutral-800">Gráfico de Ponto de Equilíbrio</h3>
              <div className="bg-neutral-50 rounded-xl p-2">
                {renderSvgGrafico()}
              </div>
            </div>

          </div>

        </div>

        {/* ============================================ */}
        {/* MEMÓRIA DE CÁLCULO (12 colunas)             */}
        {/* ============================================ */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <h2 className="font-bold text-lg text-neutral-800 mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Memória de Cálculo
          </h2>
          <div className="font-mono text-xs text-neutral-700 space-y-4 bg-neutral-50 rounded-xl p-5">
            <div>
              <span className="text-emerald-800 font-bold block mb-1">1. Custos Consolidados:</span>
              Custo Variável Total = {sementes} + {fertilizantes} + {defensivos} + {combustivel} + {colheita} + {outrosVariaveis} = <span className="font-bold">R$ {custoVariavelTotal.toLocaleString("pt-BR")} / ha</span>
              <br />
              Custo Fixo Total = {maoDeObra} + {depreciacao} + {arrendamento} + {outrosFixos} = <span className="font-bold">R$ {custoFixoTotal.toLocaleString("pt-BR")} / ha</span>
              <br />
              Custo Total Geral = Custo Variável + Custo Fixo = <span className="font-bold">R$ {custoTotalHa.toLocaleString("pt-BR")} / ha</span>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">2. Margem de Contribuição (MC):</span>
              Custo Variável por Saca = Custo Variável Total / Produtividade Alvo
              <br />
              Custo Variável por Saca = {custoVariavelTotal} / {produtividade} = R$ {custoVariavelSaca.toFixed(2)} / saca
              <br />
              <br />
              Margem de Contribuição por Saca = Preço da Saca - Custo Variável por Saca
              <br />
              Margem de Contribuição por Saca = {precoSaca} - {custoVariavelSaca.toFixed(2)} = <span className="font-bold">R$ {margemSaca.toFixed(2)} / saca</span>
              <br />
              <br />
              Margem de Contribuição por Hectare = Margem por Saca × Produtividade Alvo
              <br />
              Margem de Contribuição por Hectare = {margemSaca.toFixed(2)} × {produtividade} = <span className="font-bold">R$ {margemHa.toLocaleString("pt-BR")} / ha</span> ({margemPct.toFixed(1)}%)
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">3. Ponto de Equilíbrio Operacional (PE):</span>
              PE em Sacas/ha = Custo Fixo Total / Margem de Contribuição por Saca
              <br />
              PE em Sacas/ha = {custoFixoTotal} / {margemSaca.toFixed(2)} = <span className="font-bold text-emerald-800">{peSacas.toFixed(2)} sacas/ha</span>
              <br />
              <br />
              Preço de Equilíbrio (Saca) = Custo Total Geral / Produtividade Alvo
              <br />
              Preço de Equilíbrio (Saca) = {custoTotalHa} / {produtividade} = <span className="font-bold text-emerald-800">R$ {precoEquilibrio.toFixed(2)} / saca</span>
            </div>
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
              Laudo de Viabilidade Financeira e Ponto de Equilíbrio
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
                    <th className="p-2 text-left font-bold text-emerald-900 border border-emerald-200">Indicador Econômico</th>
                    <th className="p-2 text-right font-bold text-emerald-900 border border-emerald-200">Valor / ha</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-neutral-200">Área Cultivada</td><td className="p-2 text-right font-bold border border-neutral-200">{areaHa} ha</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Meta de Produtividade</td><td className="p-2 text-right font-bold border border-neutral-200">{produtividade} sc/ha</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Preço de Venda Praticado</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {precoSaca.toFixed(2)}/sc</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Custo Variável Operacional</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {custoVariavelTotal.toLocaleString("pt-BR")} / ha</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Custo Fixo Operacional</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {custoFixoTotal.toLocaleString("pt-BR")} / ha</td></tr>
                  
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Margem de Contribuição</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">R$ {margemHa.toLocaleString("pt-BR")} / ha ({margemPct.toFixed(1)}%)</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Ponto de Equilíbrio (Produtividade)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">{peSacas.toFixed(1)} sacas / ha</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Ponto de Equilíbrio (Faturamento)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">R$ {peReais.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} / ha</td>
                  </tr>
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Preço de Equilíbrio por Saca</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">R$ {precoEquilibrio.toFixed(2)} / saca</td>
                  </tr>

                  <tr><td className="p-2 border border-neutral-200">Responsável Técnico</td><td className="p-2 text-right font-bold border border-neutral-200">{responsavel}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Produtor / Cliente</td><td className="p-2 text-right font-bold border border-neutral-200">{cliente}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Diagrama Visual */}
            <div className="flex flex-col items-center justify-start pt-4">
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Gráfico Cartesiano do Ponto de Equilíbrio</h3>
              <div className="w-full max-w-[250px] shadow-sm border border-neutral-200 rounded-xl overflow-hidden p-2 bg-white">
                {renderSvgGrafico()}
              </div>
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
