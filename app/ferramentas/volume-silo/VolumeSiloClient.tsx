"use client"

import React from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Warehouse } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface VolumeSiloClientProps {
  isPro: boolean;
  userName?: string;
}

type TipoSilo = "trincheira" | "encosto" | "bolsa";
type MaterialEnsilado = "milho_silagem" | "sorgo_silagem" | "capim_silagem" | "cana_silagem" | "milho_grao_umido" | "soja_grao" | "trigo_grao" | "algodao_caroco" | "arroz_casca" | "feijao_grao" | "cafe_beneficiado";

const MATERIAIS: Record<MaterialEnsilado, { nome: string; densidade: number }> = {
  milho_silagem: { nome: "Milho Silagem", densidade: 0.55 },
  sorgo_silagem: { nome: "Sorgo Silagem", densidade: 0.50 },
  capim_silagem: { nome: "Capim Silagem", densidade: 0.45 },
  cana_silagem: { nome: "Cana Silagem", densidade: 0.50 },
  milho_grao_umido: { nome: "Milho Grão Úmido", densidade: 0.75 },
  soja_grao: { nome: "Soja Grão", densidade: 0.72 },
  trigo_grao: { nome: "Trigo Grão", densidade: 0.78 },
  algodao_caroco: { nome: "Algodão Caroço", densidade: 0.40 },
  arroz_casca: { nome: "Arroz em Casca", densidade: 0.58 },
  feijao_grao: { nome: "Feijão Grão", densidade: 0.77 },
  cafe_beneficiado: { nome: "Café Beneficiado", densidade: 0.60 },
};

export default function VolumeSiloClient({ isPro, userName }: VolumeSiloClientProps) {
  // Tipo de Silo
  const [tipoSilo, setTipoSilo] = useState<TipoSilo>("trincheira");

  // Dimensões Trincheira
  const [trinComprimento, setTrinComprimento] = useState<number>(30);
  const [trinLarguraBase, setTrinLarguraBase] = useState<number>(4);
  const [trinLarguraTopo, setTrinLarguraTopo] = useState<number>(6);
  const [trinProfundidade, setTrinProfundidade] = useState<number>(2.5);

  // Dimensões Encosto
  const [encComprimento, setEncComprimento] = useState<number>(25);
  const [encLarguraBase, setEncLarguraBase] = useState<number>(3);
  const [encLarguraTopo, setEncLarguraTopo] = useState<number>(5);
  const [encAltura, setEncAltura] = useState<number>(3);

  // Dimensões Bolsa
  const [bolDiametro, setBolDiametro] = useState<number>(2.70);
  const [bolComprimento, setBolComprimento] = useState<number>(60);

  // Material e Densidade
  const [material, setMaterial] = useState<MaterialEnsilado>("milho_silagem");
  const [densidadeCustom, setDensidadeCustom] = useState<number>(MATERIAIS.milho_silagem.densidade);

  // Carga do caminhão
  const [pesoCarga, setPesoCarga] = useState<number>(28);

  // Laudo
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");

  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [showValidationError, setShowValidationError] = useState<boolean>(false);

  // ======================================================
  // CÁLCULOS
  // ======================================================
  const calcularVolume = (): number => {
    switch (tipoSilo) {
      case "trincheira":
        return trinComprimento * ((trinLarguraBase + trinLarguraTopo) / 2) * trinProfundidade;
      case "encosto":
        return encComprimento * ((encLarguraBase + encLarguraTopo) / 2) * encAltura;
      case "bolsa":
        return Math.PI * Math.pow(bolDiametro / 2, 2) * bolComprimento;
      default:
        return 0;
    }
  };

  const volumeM3 = calcularVolume();
  const capacidadeTon = volumeM3 * densidadeCustom;
  const numCargas = pesoCarga > 0 ? capacidadeTon / pesoCarga : 0;

  // Gráfico de rosca: proporção de preenchimento (cap. em t vs. volume total teórico)
  const pctPreenchido = Math.min(100, Math.round((densidadeCustom / 1.0) * 100));
  const pctVazio = 100 - pctPreenchido;

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "";

  const getNomeTipoSilo = () => {
    switch (tipoSilo) {
      case "trincheira": return "Trincheira";
      case "encosto": return "Encosto";
      case "bolsa": return "Bolsa";
    }
  };

  // ======================================================
  // PDF / IMPRESSÃO
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
      pdf.save(`Volume-Silo-${cliente || "Laudo"}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  // ======================================================
  // SVG DINÂMICO DO SILO
  // ======================================================
  const renderSvgSilo = () => {
    const w = 280;
    const h = 160;
    const pad = 20;

    if (tipoSilo === "trincheira") {
      // Vista frontal trapezoidal (escavado)
      const baseW = w * 0.45;
      const topoW = w * 0.65;
      const siloH = h - pad * 2;
      const cx = w / 2;
      const bottom = h - pad;
      const top = pad;
      const p1 = `${cx - topoW / 2},${top}`;
      const p2 = `${cx + topoW / 2},${top}`;
      const p3 = `${cx + baseW / 2},${bottom}`;
      const p4 = `${cx - baseW / 2},${bottom}`;

      return (
        <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full h-36">
          {/* Solo */}
          <rect x="0" y={top} width={w} height={siloH} fill="#e8dcc8" opacity="0.3" rx="4" />
          {/* Trincheira */}
          <polygon points={`${p1} ${p2} ${p3} ${p4}`} fill="#059669" opacity="0.7" stroke="#047857" strokeWidth="2" />
          {/* Silagem preenchida */}
          <polygon
            points={`${p1} ${p2} ${cx + baseW / 2 + (topoW / 2 - baseW / 2) * 0.3},${bottom - siloH * 0.3} ${cx - baseW / 2 - (topoW / 2 - baseW / 2) * 0.3},${bottom - siloH * 0.3}`}
            fill="#16a34a" opacity="0.5"
          />
          {/* Cotas */}
          <line x1={cx - topoW / 2} y1={top - 5} x2={cx + topoW / 2} y2={top - 5} stroke="#374151" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
          <text x={cx} y={top - 8} textAnchor="middle" className="text-[9px]" fill="#374151">{tipoSilo === "trincheira" ? trinLarguraTopo : encLarguraTopo}m (topo)</text>
          <line x1={cx - baseW / 2} y1={bottom + 5} x2={cx + baseW / 2} y2={bottom + 5} stroke="#374151" strokeWidth="1" />
          <text x={cx} y={bottom + 16} textAnchor="middle" className="text-[9px]" fill="#374151">{trinLarguraBase}m (base)</text>
          <line x1={cx + topoW / 2 + 8} y1={top} x2={cx + topoW / 2 + 8} y2={bottom} stroke="#374151" strokeWidth="1" />
          <text x={cx + topoW / 2 + 12} y={(top + bottom) / 2} textAnchor="start" className="text-[9px]" fill="#374151" transform={`rotate(90, ${cx + topoW / 2 + 12}, ${(top + bottom) / 2})`}>{trinProfundidade}m</text>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#374151" />
            </marker>
          </defs>
        </svg>
      );
    }

    if (tipoSilo === "encosto") {
      const wallH = h - pad * 2;
      const baseW = w * 0.55;
      const bottom = h - pad;
      const top = pad;
      const wallX = pad + 10;

      return (
        <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full h-36">
          {/* Parede de encosto */}
          <rect x={wallX - 4} y={top} width="8" height={wallH} fill="#78716c" rx="2" />
          <text x={wallX} y={top - 5} textAnchor="middle" className="text-[8px]" fill="#78716c">Parede</text>
          {/* Silagem em rampa */}
          <polygon
            points={`${wallX + 4},${top} ${wallX + 4},${bottom} ${wallX + baseW},${bottom} ${wallX + baseW * 0.7},${top + wallH * 0.3}`}
            fill="#059669" opacity="0.7" stroke="#047857" strokeWidth="2"
          />
          {/* Cotas altura */}
          <line x1={wallX - 15} y1={top} x2={wallX - 15} y2={bottom} stroke="#374151" strokeWidth="1" />
          <text x={wallX - 18} y={(top + bottom) / 2} textAnchor="end" className="text-[9px]" fill="#374151">{encAltura}m</text>
          {/* Cota largura base */}
          <line x1={wallX + 4} y1={bottom + 8} x2={wallX + baseW} y2={bottom + 8} stroke="#374151" strokeWidth="1" />
          <text x={wallX + baseW / 2} y={bottom + 20} textAnchor="middle" className="text-[9px]" fill="#374151">{encLarguraTopo}m (topo)</text>
        </svg>
      );
    }

    if (tipoSilo === "bolsa") {
      const bagH = h * 0.45;
      const bagW = w * 0.8;
      const cx = w / 2;
      const cy = h / 2;

      return (
        <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-36">
          {/* Corpo cilíndrico */}
          <rect x={cx - bagW / 2} y={cy - bagH / 2} width={bagW} height={bagH} fill="#059669" opacity="0.6" rx={bagH / 2} stroke="#047857" strokeWidth="2" />
          {/* Elipses laterais */}
          <ellipse cx={cx - bagW / 2} cy={cy} rx={bagH * 0.3} ry={bagH / 2} fill="#16a34a" opacity="0.4" stroke="#047857" strokeWidth="1.5" />
          <ellipse cx={cx + bagW / 2} cy={cy} rx={bagH * 0.3} ry={bagH / 2} fill="#16a34a" opacity="0.4" stroke="#047857" strokeWidth="1.5" />
          {/* Solo / base */}
          <line x1={cx - bagW / 2 - 10} y1={cy + bagH / 2} x2={cx + bagW / 2 + 10} y2={cy + bagH / 2} stroke="#a3a3a3" strokeWidth="1" strokeDasharray="4" />
          {/* Cota comprimento */}
          <line x1={cx - bagW / 2} y1={cy + bagH / 2 + 12} x2={cx + bagW / 2} y2={cy + bagH / 2 + 12} stroke="#374151" strokeWidth="1" />
          <text x={cx} y={cy + bagH / 2 + 24} textAnchor="middle" className="text-[9px]" fill="#374151">{bolComprimento}m (comprimento)</text>
          {/* Cota diâmetro */}
          <line x1={cx + bagW / 2 + 12} y1={cy - bagH / 2} x2={cx + bagW / 2 + 12} y2={cy + bagH / 2} stroke="#374151" strokeWidth="1" />
          <text x={cx + bagW / 2 + 16} y={cy + 3} textAnchor="start" className="text-[9px]" fill="#374151">⌀{bolDiametro}m</text>
        </svg>
      );
    }

    return null;
  };

  // ======================================================
  // GRÁFICO DE ROSCA SVG
  // ======================================================
  const renderDonut = () => {
    const size = 144;
    const cx = size / 2;
    const cy = size / 2;
    const r = 52;
    const circ = 2 * Math.PI * r;
    const dashPreenchido = (pctPreenchido / 100) * circ;
    const dashVazio = circ - dashPreenchido;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="18" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="#059669" strokeWidth="18"
          strokeDasharray={`${dashPreenchido} ${dashVazio}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-lg font-extrabold" fill="#059669">{volumeM3.toFixed(0)}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="text-[10px]" fill="#6b7280">m³</text>
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
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Calculadora de Volume de Silo</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Trincheira, Encosto e Bolsa — Armazenamento & Silagem
                <Link href="/ajuda#volume-silo" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
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
            
            {/* Bloco 1: Tipo de Silo */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Tipo de Silo</h2>
                <p className="text-xs text-neutral-500 mt-1">Selecione a geometria do silo para dimensionamento</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(["trincheira", "encosto", "bolsa"] as TipoSilo[]).map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setTipoSilo(tipo)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      tipoSilo === tipo
                        ? "border-emerald-600 bg-emerald-50 shadow-sm"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <span className="text-2xl block mb-1">
                      {tipo === "trincheira" ? "⛏️" : tipo === "encosto" ? "🧱" : "🫧"}
                    </span>
                    <span className={`text-xs font-bold block ${tipoSilo === tipo ? "text-emerald-800" : "text-neutral-600"}`}>
                      {tipo === "trincheira" ? "Trincheira" : tipo === "encosto" ? "Encosto" : "Bolsa"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bloco 2: Dimensões */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Dimensões do Silo</h2>
                <p className="text-xs text-neutral-500 mt-1">Informe as medidas em metros para o tipo selecionado</p>
              </div>

              {tipoSilo === "trincheira" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Comprimento (m)</label>
                    <input type="number" value={trinComprimento} onChange={(e) => setTrinComprimento(Number(e.target.value))} min={1} step={0.5} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Largura da Base (m)</label>
                    <input type="number" value={trinLarguraBase} onChange={(e) => setTrinLarguraBase(Number(e.target.value))} min={0.5} step={0.5} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Largura do Topo (m)</label>
                    <input type="number" value={trinLarguraTopo} onChange={(e) => setTrinLarguraTopo(Number(e.target.value))} min={0.5} step={0.5} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Profundidade (m)</label>
                    <input type="number" value={trinProfundidade} onChange={(e) => setTrinProfundidade(Number(e.target.value))} min={0.5} step={0.5} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                  </div>
                </div>
              )}

              {tipoSilo === "encosto" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Comprimento (m)</label>
                    <input type="number" value={encComprimento} onChange={(e) => setEncComprimento(Number(e.target.value))} min={1} step={0.5} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Largura da Base (m)</label>
                    <input type="number" value={encLarguraBase} onChange={(e) => setEncLarguraBase(Number(e.target.value))} min={0.5} step={0.5} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Largura do Topo (m)</label>
                    <input type="number" value={encLarguraTopo} onChange={(e) => setEncLarguraTopo(Number(e.target.value))} min={0.5} step={0.5} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Altura da Parede (m)</label>
                    <input type="number" value={encAltura} onChange={(e) => setEncAltura(Number(e.target.value))} min={0.5} step={0.5} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                  </div>
                </div>
              )}

              {tipoSilo === "bolsa" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Diâmetro da Bolsa (m)</label>
                    <select
                      value={bolDiametro}
                      onChange={(e) => setBolDiametro(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    >
                      <option value={1.50}>1,50 m (5 pés)</option>
                      <option value={1.80}>1,80 m (6 pés)</option>
                      <option value={2.10}>2,10 m (7 pés)</option>
                      <option value={2.40}>2,40 m (8 pés)</option>
                      <option value={2.70}>2,70 m (9 pés)</option>
                      <option value={3.00}>3,00 m (10 pés)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Comprimento (m)</label>
                    <input type="number" value={bolComprimento} onChange={(e) => setBolComprimento(Number(e.target.value))} min={1} step={1} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 3: Material Ensilado */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Material Ensilado</h2>
                <p className="text-xs text-neutral-500 mt-1">Tipo de silagem e densidade de compactação</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Cultura / Material</label>
                  <select
                    value={material}
                    onChange={(e) => {
                      const val = e.target.value as MaterialEnsilado;
                      setMaterial(val);
                      setDensidadeCustom(MATERIAIS[val].densidade);
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    {Object.entries(MATERIAIS).map(([key, m]) => (
                      <option key={key} value={key}>{m.nome} ({m.densidade} t/m³)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Densidade (t/m³)
                    <span className="ml-1 relative group">
                      <HelpCircle className="inline w-3 h-3 text-neutral-400" />
                      <span className="invisible group-hover:visible absolute left-0 bottom-full mb-1 bg-neutral-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        Ajuste conforme o grau de compactação real
                      </span>
                    </span>
                  </label>
                  <input type="number" value={densidadeCustom} onChange={(e) => setDensidadeCustom(Number(e.target.value))} min={0.1} max={1.5} step={0.01} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Peso por Carga / Caminhão (t)</label>
                  <input type="number" value={pesoCarga} onChange={(e) => setPesoCarga(Number(e.target.value))} min={1} step={1} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white" />
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
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Volume Total</p>
                <p className="text-4xl font-extrabold tracking-tight">{volumeM3.toFixed(1)} <span className="text-lg font-bold text-emerald-300">m³</span></p>
                <p className="text-emerald-400 text-xs mt-1">Silo {getNomeTipoSilo()} — {MATERIAIS[material].nome}</p>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-emerald-900">
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Capacidade</p>
                    <p className="text-xl font-extrabold">{capacidadeTon.toFixed(1)} <span className="text-xs text-emerald-300">t</span></p>
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Nº de Cargas</p>
                    <p className="text-xl font-extrabold">{numCargas.toFixed(1)} <span className="text-xs text-emerald-300">cargas</span></p>
                  </div>
                </div>

                {!isPro ? null : !isFormValid ? (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha o Produtor / Cliente para emitir o Laudo.
                  </div>
                ) : null}
              </div>
            </div>

            {/* Card Detalhamento */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-800 mb-4">Diagrama do Silo</h3>
              <div className="bg-neutral-50 rounded-xl p-4">
                {renderSvgSilo()}
              </div>

              <div className="mt-4">
                <h4 className="font-bold text-xs text-neutral-600 uppercase tracking-wider mb-3">Composição Volumétrica</h4>
                {renderDonut()}
                <div className="flex justify-center gap-6 mt-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Material ({pctPreenchido}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-200 inline-block" /> Ar/Vazio ({pctVazio}%)
                  </span>
                </div>
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
            Memória de Cálculo — Volume de Silo
          </h2>
          <div className="font-mono text-xs text-neutral-700 space-y-4 bg-neutral-50 rounded-xl p-5">
            <div>
              <span className="text-emerald-800 font-bold block mb-1">1. Tipo de Silo Selecionado: {getNomeTipoSilo()}</span>
              {tipoSilo === "trincheira" && (
                <>
                  <p>
                    O silo trincheira possui seção transversal trapezoidal. O volume é calculado pela média das larguras (base e topo) multiplicada pela profundidade e pelo comprimento.
                  </p>
                  <div className="pt-2 border-t border-neutral-200 mt-2">
                    V = Comprimento × ((Lb + Lt) / 2) × Profundidade
                    <br />
                    V = {trinComprimento} × (({trinLarguraBase} + {trinLarguraTopo}) / 2) × {trinProfundidade}
                    <br />
                    V = {trinComprimento} × {((trinLarguraBase + trinLarguraTopo) / 2).toFixed(2)} × {trinProfundidade}
                    <br />
                    <span className="font-bold text-emerald-800">V = {volumeM3.toFixed(2)} m³</span>
                  </div>
                </>
              )}
              {tipoSilo === "encosto" && (
                <>
                  <p>
                    O silo de encosto utiliza uma parede como apoio lateral. A seção transversal é trapezoidal, com a silagem compactada contra a estrutura existente.
                  </p>
                  <div className="pt-2 border-t border-neutral-200 mt-2">
                    V = Comprimento × ((Lb + Lt) / 2) × Altura
                    <br />
                    V = {encComprimento} × (({encLarguraBase} + {encLarguraTopo}) / 2) × {encAltura}
                    <br />
                    V = {encComprimento} × {((encLarguraBase + encLarguraTopo) / 2).toFixed(2)} × {encAltura}
                    <br />
                    <span className="font-bold text-emerald-800">V = {volumeM3.toFixed(2)} m³</span>
                  </div>
                </>
              )}
              {tipoSilo === "bolsa" && (
                <>
                  <p>
                    O silo bolsa é um tubo cilíndrico de polietileno. O volume corresponde à área da seção circular multiplicada pelo comprimento do tubo.
                  </p>
                  <div className="pt-2 border-t border-neutral-200 mt-2">
                    V = π × (D/2)² × Comprimento
                    <br />
                    V = π × ({bolDiametro}/2)² × {bolComprimento}
                    <br />
                    V = {Math.PI.toFixed(4)} × {(bolDiametro / 2).toFixed(2)}² × {bolComprimento}
                    <br />
                    V = {Math.PI.toFixed(4)} × {Math.pow(bolDiametro / 2, 2).toFixed(4)} × {bolComprimento}
                    <br />
                    <span className="font-bold text-emerald-800">V = {volumeM3.toFixed(2)} m³</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-200">
              <span className="text-blue-800 font-bold block mb-1">2. Capacidade Estimada (toneladas):</span>
              Capacidade = Volume × Densidade
              <br />
              Capacidade = {volumeM3.toFixed(2)} m³ × {densidadeCustom.toFixed(2)} t/m³
              <br />
              <span className="font-bold text-blue-800">Capacidade = {capacidadeTon.toFixed(2)} t ({(capacidadeTon * 1000).toFixed(0)} kg)</span>
            </div>

            <div className="pt-3 border-t border-neutral-200">
              <span className="text-purple-800 font-bold block mb-1">3. Equivalência em Cargas:</span>
              Nº Cargas = Capacidade / Peso por Carga
              <br />
              Nº Cargas = {capacidadeTon.toFixed(2)} t / {pesoCarga} t
              <br />
              <span className="font-bold text-purple-800">Nº Cargas = {numCargas.toFixed(1)} cargas de {pesoCarga}t</span>
            </div>

            <div className="pt-3 border-t border-neutral-200">
              <span className="text-amber-800 font-bold block mb-1">4. Referência de Densidades Típicas:</span>
              <span className="text-amber-700 font-bold text-[10px] block mt-1 mb-0.5">Silagens:</span>
              - Milho Silagem (bem compactado): 0,50 – 0,65 t/m³
              <br />
              - Sorgo Silagem: 0,45 – 0,55 t/m³
              <br />
              - Capim (Napier, Mombaça): 0,40 – 0,50 t/m³
              <br />
              - Cana-de-açúcar picada: 0,45 – 0,55 t/m³
              <br />
              - Milho Grão Úmido: 0,70 – 0,80 t/m³
              <br />
              <span className="text-amber-700 font-bold text-[10px] block mt-2 mb-0.5">Grãos a Granel:</span>
              - Soja Grão: 0,68 – 0,76 t/m³
              <br />
              - Trigo Grão: 0,75 – 0,82 t/m³
              <br />
              - Algodão Caroço: 0,35 – 0,45 t/m³
              <br />
              - Arroz em Casca: 0,55 – 0,62 t/m³
              <br />
              - Feijão Grão: 0,73 – 0,80 t/m³
              <br />
              - Café Beneficiado: 0,55 – 0,65 t/m³
              <br />
              <span className="text-neutral-500 text-[10px] mt-1 block">Fonte: Embrapa / Conab — valores de referência para armazenamento e silagem compactada.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print"><Footer /></div>

      {/* ------------------------------------------------------------- */}
      {/* ----------------- ESTRUTURA PARA PDF/PRINT ------------------- */}
      {/* ------------------------------------------------------------- */}
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
              Laudo de Volume de Silo — {getNomeTipoSilo()}
            </h2>
            <p className="text-xs text-neutral-500 text-center mt-1">
              Emitido em {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Conteúdo em duas colunas */}
          <div className="grid grid-cols-2 gap-6 mt-6 flex-1">
            {/* Tabela de Parâmetros */}
            <div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="p-2 text-left font-bold text-emerald-900 border border-emerald-200">Parâmetro</th>
                    <th className="p-2 text-right font-bold text-emerald-900 border border-emerald-200">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-neutral-200">Tipo de Silo</td><td className="p-2 text-right font-bold border border-neutral-200">{getNomeTipoSilo()}</td></tr>
                  {tipoSilo === "trincheira" && (
                    <>
                      <tr><td className="p-2 border border-neutral-200">Comprimento</td><td className="p-2 text-right font-bold border border-neutral-200">{trinComprimento} m</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Largura Base</td><td className="p-2 text-right font-bold border border-neutral-200">{trinLarguraBase} m</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Largura Topo</td><td className="p-2 text-right font-bold border border-neutral-200">{trinLarguraTopo} m</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Profundidade</td><td className="p-2 text-right font-bold border border-neutral-200">{trinProfundidade} m</td></tr>
                    </>
                  )}
                  {tipoSilo === "encosto" && (
                    <>
                      <tr><td className="p-2 border border-neutral-200">Comprimento</td><td className="p-2 text-right font-bold border border-neutral-200">{encComprimento} m</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Largura Base</td><td className="p-2 text-right font-bold border border-neutral-200">{encLarguraBase} m</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Largura Topo</td><td className="p-2 text-right font-bold border border-neutral-200">{encLarguraTopo} m</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Altura Parede</td><td className="p-2 text-right font-bold border border-neutral-200">{encAltura} m</td></tr>
                    </>
                  )}
                  {tipoSilo === "bolsa" && (
                    <>
                      <tr><td className="p-2 border border-neutral-200">Diâmetro</td><td className="p-2 text-right font-bold border border-neutral-200">{bolDiametro} m</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Comprimento</td><td className="p-2 text-right font-bold border border-neutral-200">{bolComprimento} m</td></tr>
                    </>
                  )}
                  <tr className="bg-emerald-50"><td className="p-2 border border-emerald-200 font-bold">Volume Total</td><td className="p-2 text-right font-extrabold text-emerald-800 border border-emerald-200">{volumeM3.toFixed(2)} m³</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Material Ensilado</td><td className="p-2 text-right font-bold border border-neutral-200">{MATERIAIS[material].nome}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Densidade</td><td className="p-2 text-right font-bold border border-neutral-200">{densidadeCustom.toFixed(2)} t/m³</td></tr>
                  <tr className="bg-blue-50"><td className="p-2 border border-blue-200 font-bold">Capacidade</td><td className="p-2 text-right font-extrabold text-blue-800 border border-blue-200">{capacidadeTon.toFixed(2)} t</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Nº de Cargas ({pesoCarga}t)</td><td className="p-2 text-right font-bold border border-neutral-200">{numCargas.toFixed(1)}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Responsável Técnico</td><td className="p-2 text-right font-bold border border-neutral-200">{responsavel}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Produtor / Cliente</td><td className="p-2 text-right font-bold border border-neutral-200">{cliente}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Diagrama SVG */}
            <div className="flex flex-col items-center justify-start pt-4">
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Diagrama do Silo</h3>
              <div className="w-full max-w-[260px]">
                {renderSvgSilo()}
              </div>
              <div className="mt-6 w-36 h-36">
                {renderDonut()}
              </div>
              <div className="flex justify-center gap-4 mt-2 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Material ({pctPreenchido}%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-200 inline-block" /> Ar ({pctVazio}%)</span>
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
