"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Scale, Coins } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface SimuladorBarterClientProps {
  isPro: boolean;
  userName?: string;
}

type CommodityType = "soja" | "milho" | "trigo" | "algodao" | "arroz" | "feijao" | "sorgo" | "cafe" | "cana" | "manual";
type AlternativaType = "a_vista" | "financiado";

interface CommodityPreset {
  produtividade: number;
  custoInsumos: number;
  precoBarter: number;
  precoMercado: number;
}

const COMMODITIES: Record<CommodityType, { nome: string; data: CommodityPreset }> = {
  soja: {
    nome: "Soja (sc de 60kg)",
    data: {
      produtividade: 60,
      custoInsumos: 320000,
      precoBarter: 124,
      precoMercado: 130,
    },
  },
  milho: {
    nome: "Milho (sc de 60kg)",
    data: {
      produtividade: 110,
      custoInsumos: 420000,
      precoBarter: 56,
      precoMercado: 60,
    },
  },
  trigo: {
    nome: "Trigo (sc de 60kg)",
    data: {
      produtividade: 50,
      custoInsumos: 260000,
      precoBarter: 74,
      precoMercado: 78,
    },
  },
  algodao: {
    nome: "Algodão (@ de pluma)",
    data: {
      produtividade: 280,
      custoInsumos: 850000,
      precoBarter: 80,
      precoMercado: 85,
    },
  },
  arroz: {
    nome: "Arroz (sc de 50kg)",
    data: {
      produtividade: 140,
      custoInsumos: 680000,
      precoBarter: 108,
      precoMercado: 115,
    },
  },
  feijao: {
    nome: "Feijão (sc de 60kg)",
    data: {
      produtividade: 35,
      custoInsumos: 180000,
      precoBarter: 260,
      precoMercado: 275,
    },
  },
  sorgo: {
    nome: "Sorgo (sc de 60kg)",
    data: {
      produtividade: 80,
      custoInsumos: 220000,
      precoBarter: 44,
      precoMercado: 48,
    },
  },
  cafe: {
    nome: "Café (sc de 60kg beneficiado)",
    data: {
      produtividade: 32,
      custoInsumos: 480000,
      precoBarter: 1100,
      precoMercado: 1150,
    },
  },
  cana: {
    nome: "Cana-de-Açúcar (toneladas)",
    data: {
      produtividade: 85,
      custoInsumos: 340000,
      precoBarter: 132,
      precoMercado: 140,
    },
  },
  manual: {
    nome: "Outro / Personalizado",
    data: {
      produtividade: 60,
      custoInsumos: 300000,
      precoBarter: 120,
      precoMercado: 125,
    },
  },
};

export default function SimuladorBarterClient({ isPro, userName }: SimuladorBarterClientProps) {
  const [commodity, setCommodity] = useState<CommodityType>("soja");
  
  // Parâmetros de Produção
  const [areaHa, setAreaHa] = useState<number>(100);
  const [produtividade, setProdutividade] = useState<number>(COMMODITIES.soja.data.produtividade);
  const [custoInsumos, setCustoInsumos] = useState<number>(COMMODITIES.soja.data.custoInsumos);

  // Parâmetros do Barter
  const [precoBarter, setPrecoBarter] = useState<number>(COMMODITIES.soja.data.precoBarter);

  // Parâmetros Alternativos
  const [tipoAlternativa, setTipoAlternativa] = useState<AlternativaType>("financiado");
  const [descontoCash, setDescontoCash] = useState<number>(5);
  const [taxaJuros, setTaxaJuros] = useState<number>(8.5);
  const [precoMercadoFuturo, setPrecoMercadoFuturo] = useState<number>(COMMODITIES.soja.data.precoMercado);

  // Laudo Técnico
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");
  const [showValidationError, setShowValidationError] = useState<boolean>(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "";

  // ======================================================
  // PROCESSAMENTO DE CÁLCULO
  // ======================================================
  const producaoTotal = areaHa * produtividade;

  // Barter
  const sacasBarter = precoBarter > 0 ? custoInsumos / precoBarter : 0;
  const sacasBarterHa = areaHa > 0 ? sacasBarter / areaHa : 0;
  const pctBarter = producaoTotal > 0 ? (sacasBarter / producaoTotal) * 100 : 0;

  // Alternativa Financeira
  const custoFinanceiroAlternativa = tipoAlternativa === "a_vista" 
    ? custoInsumos * (1 - descontoCash / 100) 
    : custoInsumos * (1 + taxaJuros / 100);

  const sacasAlternativo = precoMercadoFuturo > 0 ? custoFinanceiroAlternativa / precoMercadoFuturo : 0;
  const sacasAlternativoHa = areaHa > 0 ? sacasAlternativo / areaHa : 0;
  const pctAlternativo = producaoTotal > 0 ? (sacasAlternativo / producaoTotal) * 100 : 0;

  // Comparação
  const diferencaSacas = Math.abs(sacasBarter - sacasAlternativo);
  const diferencaFinanceira = diferencaSacas * precoMercadoFuturo;
  const barterVantajoso = sacasBarter < sacasAlternativo;

  // ======================================================
  // TRATAMENTO DE PRESETS
  // ======================================================
  const handleCommodityChange = (key: CommodityType) => {
    setCommodity(key);
    const cData = COMMODITIES[key].data;
    setProdutividade(cData.produtividade);
    setCustoInsumos(cData.custoInsumos);
    setPrecoBarter(cData.precoBarter);
    setPrecoMercadoFuturo(cData.precoMercado);
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
      pdf.save(`Simulacao-Barter-${cliente || "Laudo"}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  // ======================================================
  // BALANÇA DE PRATOS SVG DINÂMICA
  // ======================================================
  const renderSvgBalanca = () => {
    // Calcula a inclinação da balança com base na diferença de sacas.
    // Lote mais pesado (mais sacas comprometidas) desce.
    let inclinacao = 0;
    if (sacasBarter > 0 && sacasAlternativo > 0) {
      const diffPct = (sacasBarter - sacasAlternativo) / Math.max(sacasBarter, sacasAlternativo);
      inclinacao = Math.min(Math.max(diffPct * 15, -15), 15); // Limita entre -15 e 15 graus
    }

    // Coordenadas centrais da balança
    const cX = 100;
    const cY = 70; // Fulcro
    
    // Coordenadas dos pratos no ângulo atual
    const rad = (inclinacao * Math.PI) / 180;
    const offsetW = 65; // Metade do comprimento da barra da balança
    
    const esqX = cX - offsetW * Math.cos(rad);
    const esqY = cY - offsetW * Math.sin(rad);

    const dirX = cX + offsetW * Math.cos(rad);
    const dirY = cY + offsetW * Math.sin(rad);

    // Pratos suspensos (adicionamos altura da corrente)
    const correntesH = 30;
    const pratoEsqY = esqY + correntesH;
    const pratoDirY = dirY + correntesH;

    return (
      <svg viewBox="0 0 200 130" className="w-full mx-auto select-none">
        {/* Base da Balança */}
        <path d="M 90 120 L 110 120 L 105 70 L 95 70 Z" fill="#4b5563" />
        <rect x="80" y="120" width="40" height="6" rx="2" fill="#374151" />
        <circle cx={cX} cy={cY} r="4" fill="#1f2937" />

        {/* Haste de Apoio Central */}
        <line x1={cX} y1={cY} x2={cX} y2="120" stroke="#4b5563" strokeWidth="1.5" />

        {/* Barra Transversal (Balanço Rotacionado) */}
        <line x1={esqX} y1={esqY} x2={dirX} y2={dirY} stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
        
        {/* Prato Esquerdo: Barter */}
        {/* Correntes */}
        <line x1={esqX} y1={esqY} x2={esqX - 10} y2={pratoEsqY} stroke="#9ca3af" strokeWidth="0.8" />
        <line x1={esqX} y1={esqY} x2={esqX + 10} y2={pratoEsqY} stroke="#9ca3af" strokeWidth="0.8" />
        {/* Bandeja */}
        <line x1={esqX - 15} y1={pratoEsqY} x2={esqX + 15} y2={pratoEsqY} stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
        {/* Sacas de Café/Soja no Prato (Pilha) */}
        <path d={`M ${esqX - 10} ${pratoEsqY} L ${esqX + 10} ${pratoEsqY} L ${esqX} ${pratoEsqY - 14} Z`} fill="#d97706" fillOpacity="0.8" />
        <text x={esqX} y={pratoEsqY - 17} textAnchor="middle" className="text-[7.5px] font-extrabold fill-amber-900 font-mono">
          {sacasBarter.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} sc
        </text>
        <text x={esqX} y={pratoEsqY + 8} textAnchor="middle" className="text-[6.5px] font-bold fill-neutral-600">
          Barter
        </text>
        {barterVantajoso && (
          <text x={esqX} y={pratoEsqY - 26} textAnchor="middle" className="text-[7.5px] font-extrabold fill-emerald-600 animate-bounce">
            ★ Econômica
          </text>
        )}

        {/* Prato Direito: Alternativa */}
        {/* Correntes */}
        <line x1={dirX} y1={dirY} x2={dirX - 10} y2={pratoDirY} stroke="#9ca3af" strokeWidth="0.8" />
        <line x1={dirX} y1={dirY} x2={dirX + 10} y2={pratoDirY} stroke="#9ca3af" strokeWidth="0.8" />
        {/* Bandeja */}
        <line x1={dirX - 15} y1={pratoDirY} x2={dirX + 15} y2={pratoDirY} stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
        {/* Sacas de Café/Soja no Prato (Pilha) */}
        <path d={`M ${dirX - 10} ${pratoDirY} L ${dirX + 10} ${pratoDirY} L ${dirX} ${pratoDirY - 14} Z`} fill="#d97706" fillOpacity="0.8" />
        <text x={dirX} y={pratoDirY - 17} textAnchor="middle" className="text-[7.5px] font-extrabold fill-amber-900 font-mono">
          {sacasAlternativo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} sc
        </text>
        <text x={dirX} y={pratoDirY + 8} textAnchor="middle" className="text-[6.5px] font-bold fill-neutral-600">
          Alternativa
        </text>
        {!barterVantajoso && (
          <text x={dirX} y={pratoDirY - 26} textAnchor="middle" className="text-[7.5px] font-extrabold fill-emerald-600 animate-bounce">
            ★ Econômica
          </text>
        )}
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
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Simulador de Operações de Barter</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Paridade de Insumos, Custo de Travamento e Viabilidade Econômica — Gestão Financeira
                <Link href="/ajuda#simulador-barter" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
                  (Como usar?)
                </Link>
              </p>
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
            
            {/* Bloco 1: Insumos e Lavouras */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">1. Pacote de Insumos e Lavoura</h2>
                <p className="text-xs text-neutral-500 mt-1">Defina a commodity de referência, área plantada e custo em reais</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Commodity / Unidade</label>
                  <select
                    value={commodity}
                    onChange={(e) => handleCommodityChange(e.target.value as CommodityType)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-medium"
                  >
                    {Object.entries(COMMODITIES).map(([key, c]) => (
                      <option key={key} value={key}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Custo Total do Pacote (R$)</label>
                  <input
                    type="number"
                    value={custoInsumos}
                    onChange={(e) => { setCustoInsumos(Number(e.target.value)); setCommodity("manual"); }}
                    min={1}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-neutral-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Produtividade Esperada (sc ou @ / ha)</label>
                  <input
                    type="number"
                    value={produtividade}
                    onChange={(e) => { setProdutividade(Number(e.target.value)); setCommodity("manual"); }}
                    min={1}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Condições do Barter */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">2. Condições da Troca (Barter)</h2>
                <p className="text-xs text-neutral-500 mt-1">Configure o valor da saca acordado no contrato futuro de Barter</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Preço da Saca Acordado no Barter (R$)</label>
                <input
                  type="number"
                  value={precoBarter}
                  onChange={(e) => { setPrecoBarter(Number(e.target.value)); setCommodity("manual"); }}
                  min={1}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-emerald-800"
                />
              </div>
            </div>

            {/* Bloco 3: Cenário Alternativo de Compra */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">3. Cenário Alternativo (Sem Barter)</h2>
                <p className="text-xs text-neutral-500 mt-1">Simule o pagamento com dinheiro ou crédito e o preço físico esperado na colheita</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Tipo de Alternativa</label>
                  <select
                    value={tipoAlternativa}
                    onChange={(e) => setTipoAlternativa(e.target.value as AlternativaType)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    <option value="financiado">Compra Financiada (Crédito)</option>
                    <option value="a_vista">Compra à Vista (com Desconto)</option>
                  </select>
                </div>
                <div>
                  {tipoAlternativa === "a_vista" ? (
                    <>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Desconto à Vista (%)</label>
                      <input
                        type="number"
                        value={descontoCash}
                        onChange={(e) => setDescontoCash(Number(e.target.value))}
                        min={0}
                        max={100}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Juros do Período (%)</label>
                      <input
                        type="number"
                        value={taxaJuros}
                        onChange={(e) => setTaxaJuros(Number(e.target.value))}
                        min={0}
                        step={0.1}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                      />
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Preço Físico Estimado na Colheita (R$/sc ou @)</label>
                <input
                  type="number"
                  value={precoMercadoFuturo}
                  onChange={(e) => { setPrecoMercadoFuturo(Number(e.target.value)); setCommodity("manual"); }}
                  min={1}
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
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Cenário Mais Vantajoso</p>
                <p className="text-2xl font-extrabold tracking-tight">
                  {barterVantajoso ? "✓ Operação de Barter" : "✓ Cenário Alternativo"}
                </p>
                
                <p className="text-emerald-400 text-xs mt-1">
                  Economia estimada: <span className="font-bold text-white">{diferencaSacas.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} sacas</span>
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-emerald-900">
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Economia Bruta (R$)</p>
                    <p className="text-lg font-extrabold text-white">
                      R$ {diferencaFinanceira.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Comprometido</p>
                    <p className="text-lg font-extrabold text-white">
                      {barterVantajoso ? `${pctBarter.toFixed(1)}%` : `${pctAlternativo.toFixed(1)}%`}
                    </p>
                  </div>
                </div>

                {/* Detalhe de volumes */}
                <div className="mt-4 pt-3 border-t border-emerald-900 text-xs text-emerald-300">
                  <p>• Barter exige: **{sacasBarter.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} sacas** ({sacasBarterHa.toFixed(1)} sc/ha)</p>
                  <p className="mt-0.5">• Alternativa exige: **{sacasAlternativo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} sacas** ({sacasAlternativoHa.toFixed(1)} sc/ha)</p>
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
              <h3 className="font-bold text-sm text-neutral-800">Equivalência de Sacas</h3>
              <div className="bg-neutral-50 rounded-xl p-2">
                {renderSvgBalanca()}
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
              <span className="text-emerald-800 font-bold block mb-1">1. Operação de Barter (Troca):</span>
              Fórmula: Sacas Comprometidas = Custo do Pacote / Preço Garantido no Barter
              <br />
              Sacas = {custoInsumos.toLocaleString("pt-BR")} / {precoBarter} = <span className="font-bold">{sacasBarter.toFixed(2)} sacas</span>
              <br />
              <br />
              Comprometimento por ha = {sacasBarter.toFixed(2)} sc / {areaHa} ha = {sacasBarterHa.toFixed(2)} sc/ha ({pctBarter.toFixed(1)}% da colheita estimada)
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">2. Cenário Alternativo Financeiro:</span>
              {tipoAlternativa === "a_vista" ? (
                <>
                  Custo Financeiro à Vista = Custo Insumos × (1 - Desconto / 100)
                  <br />
                  Custo = {custoInsumos.toLocaleString("pt-BR")} × (1 - {descontoCash} / 100) = R$ {custoFinanceiroAlternativa.toLocaleString("pt-BR")}
                </>
              ) : (
                <>
                  Custo Financeiro Financiado = Custo Insumos × (1 + Juros / 100)
                  <br />
                  Custo = {custoInsumos.toLocaleString("pt-BR")} × (1 + {taxaJuros} / 100) = R$ {custoFinanceiroAlternativa.toLocaleString("pt-BR")}
                </>
              )}
              <br />
              <br />
              Sacas Equivalentes na Colheita = Custo Financeiro / Preço Físico Esperado na Colheita
              <br />
              Sacas Equivalentes = {custoFinanceiroAlternativa.toFixed(2)} / {precoMercadoFuturo} = <span className="font-bold">{sacasAlternativo.toFixed(2)} sacas</span>
              <br />
              Comprometimento por ha = {sacasAlternativo.toFixed(2)} sc / {areaHa} ha = {sacasAlternativoHa.toFixed(2)} sc/ha ({pctAlternativo.toFixed(1)}% da colheita estimada)
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">3. Análise da Diferença:</span>
              Diferença em Volume = | {sacasBarter.toFixed(2)} - {sacasAlternativo.toFixed(2)} | = <span className="font-bold">{diferencaSacas.toFixed(2)} sacas</span>
              <br />
              Equivalente Financeiro = Diferença em Volume × Preço Físico na Colheita
              <br />
              Equivalente Financeiro = {diferencaSacas.toFixed(2)} sc × R$ {precoMercadoFuturo.toFixed(2)} = <span className="font-bold text-emerald-850">R$ {diferencaFinanceira.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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
              Laudo Comparativo de Viabilidade de Barter
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
                    <th className="p-2 text-left font-bold text-emerald-900 border border-emerald-200">Parâmetro Avaliado</th>
                    <th className="p-2 text-right font-bold text-emerald-900 border border-emerald-200">Valor / Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-neutral-200">Área de Cultivo</td><td className="p-2 text-right font-bold border border-neutral-200">{areaHa} ha</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Custo Base do Pacote</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {custoInsumos.toLocaleString("pt-BR")}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Preço Futuro (Barter)</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {precoBarter.toFixed(2)}/sc</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Preço Mercado Físico (Estimado)</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {precoMercadoFuturo.toFixed(2)}/sc</td></tr>
                  
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Entrega via Barter</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">{sacasBarter.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sacas ({pctBarter.toFixed(1)}%)</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Entrega via Alternativa ({tipoAlternativa === "a_vista" ? "À Vista" : "Crédito"})</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">{sacasAlternativo.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sacas ({pctAlternativo.toFixed(1)}%)</td>
                  </tr>
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Cenário Recomendado</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">{barterVantajoso ? "Operação de Barter" : "Compra Direta Alternativa"}</td>
                  </tr>
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Economia Estimada (Grãos)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">{diferencaSacas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sacas</td>
                  </tr>
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Economia Equivalente (R$)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">R$ {diferencaFinanceira.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  </tr>

                  <tr><td className="p-2 border border-neutral-200">Responsável Técnico</td><td className="p-2 text-right font-bold border border-neutral-200">{responsavel}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Produtor / Cliente</td><td className="p-2 text-right font-bold border border-neutral-200">{cliente}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Diagrama Visual */}
            <div className="flex flex-col items-center justify-start pt-4">
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Equivalência de Lotes (Balança)</h3>
              <div className="w-full max-w-[250px] shadow-sm border border-neutral-200 rounded-xl overflow-hidden p-2 bg-white">
                {renderSvgBalanca()}
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
