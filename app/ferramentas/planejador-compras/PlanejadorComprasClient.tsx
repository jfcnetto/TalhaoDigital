"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Scale, PiggyBank } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PlanejadorComprasClientProps {
  isPro: boolean;
  userName?: string;
}

export default function PlanejadorComprasClient({ isPro, userName }: PlanejadorComprasClientProps) {
  // Oferta do Fornecedor
  const [valorPrazo, setValorPrazo] = useState<number>(100000);
  const [modoVista, setModoVista] = useState<"desconto" | "valor">("desconto");
  const [descontoVista, setDescontoVista] = useState<number>(6); // %
  const [valorVistaInput, setValorVistaInput] = useState<number>(94000); // R$
  const [prazoDias, setPrazoDias] = useState<number>(180);

  // Custo de Oportunidade
  const [taxaOportunidadeAno, setTaxaOportunidadeAno] = useState<number>(10.5); // % a.a. (CDI/Selic padrão)

  // Laudo Técnico
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");
  const [showValidationError, setShowValidationError] = useState<boolean>(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "";

  // ======================================================
  // PROCESSAMENTO DE CÁLCULO
  // ======================================================
  // Determina o valor à vista real
  const valorVista = modoVista === "desconto" 
    ? valorPrazo * (1 - descontoVista / 100) 
    : valorVistaInput;

  // Taxa de juros implícita do período
  const jurosPeriodo = valorVista > 0 ? (valorPrazo / valorVista) - 1 : 0;

  // Taxa de juros anualizada (composta)
  const jurosAnualizado = (valorVista > 0 && prazoDias > 0)
    ? (Math.pow(1 + jurosPeriodo, 365 / prazoDias) - 1) * 100
    : 0;

  // Taxa equivalente do custo de oportunidade para o período
  const oportunidadePeriodo = (prazoDias > 0)
    ? Math.pow(1 + taxaOportunidadeAno / 100, prazoDias / 365) - 1
    : 0;

  // Rendimento financeiro se o valor à vista fosse mantido investido
  const rendimentoR = valorVista * oportunidadePeriodo;

  // Custo líquido real da compra a prazo descontado o rendimento alternativo
  const custoRealPrazo = valorPrazo - rendimentoR;

  // Recomendação
  // Se os juros anualizados cobrados pelo fornecedor superam o rendimento do CDI, vale a pena pagar à vista.
  const aVistaVantajoso = jurosAnualizado > taxaOportunidadeAno;

  // Ganho líquido financeiro da recomendação (trazido a valor do vencimento)
  const ganhoLiquido = Math.abs(valorVista - custoRealPrazo);

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
      pdf.save(`Planejador-Compras-${cliente || "Laudo"}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  // ======================================================
  // MOSTRADOR DE VELOCÍMETROS SVG COMPARATIVOS
  // ======================================================
  const renderSvgComparativo = () => {
    // Escala máxima dos velocímetros: 30% ao ano
    const maxEscala = 30;

    const cX1 = 55;
    const cX2 = 145;
    const cY = 65;
    const r = 24;

    // Converte taxas para radianos (ângulo de -180 a 0 graus)
    const obterRad = (taxa: number) => {
      const pct = Math.min(Math.max(taxa / maxEscala, 0), 1);
      const angulo = -180 + pct * 180;
      return (angulo * Math.PI) / 180;
    };

    const radCDI = obterRad(taxaOportunidadeAno);
    const radJuros = obterRad(jurosAnualizado);

    return (
      <svg viewBox="0 0 200 110" className="w-full mx-auto select-none">
        {/* Velocímetro 1: Custo de Oportunidade */}
        {/* Arco de fundo */}
        <path d={`M ${cX1 - r} ${cY} A ${r} ${r} 0 0 1 ${cX1 + r} ${cY}`} fill="none" stroke="#e5e7eb" strokeWidth="6" strokeLinecap="round" />
        {/* Arco de preenchimento (Verde) */}
        <path d={`M ${cX1 - r} ${cY} A ${r} ${r} 0 0 1 ${cX1 + r * Math.cos(radCDI)} ${cY + r * Math.sin(radCDI)}`} fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
        {/* Agulha */}
        <line x1={cX1} y1={cY} x2={cX1 + (r - 2) * Math.cos(radCDI)} y2={cY + (r - 2) * Math.sin(radCDI)} stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={cX1} cy={cY} r="3" fill="#111827" />
        {/* Textos */}
        <text x={cX1} y={cY + 16} textAnchor="middle" className="text-[7.5px] font-extrabold fill-neutral-700">Rendimento CDI</text>
        <text x={cX1} y={cY + 26} textAnchor="middle" className="text-[9px] font-mono font-extrabold fill-emerald-600">{taxaOportunidadeAno.toFixed(1)}% a.a.</text>

        {/* Velocímetro 2: Juros do Fornecedor */}
        {/* Arco de fundo */}
        <path d={`M ${cX2 - r} ${cY} A ${r} ${r} 0 0 1 ${cX2 + r} ${cY}`} fill="none" stroke="#e5e7eb" strokeWidth="6" strokeLinecap="round" />
        {/* Arco de preenchimento (Vermelho/Laranja) */}
        <path d={`M ${cX2 - r} ${cY} A ${r} ${r} 0 0 1 ${cX2 + r * Math.cos(radJuros)} ${cY + r * Math.sin(radJuros)}`} fill="none" stroke="#f97316" strokeWidth="6" strokeLinecap="round" />
        {/* Agulha */}
        <line x1={cX2} y1={cY} x2={cX2 + (r - 2) * Math.cos(radJuros)} y2={cY + (r - 2) * Math.sin(radJuros)} stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={cX2} cy={cY} r="3" fill="#111827" />
        {/* Textos */}
        <text x={cX2} y={cY + 16} textAnchor="middle" className="text-[7.5px] font-extrabold fill-neutral-700">Juros Fornecedor</text>
        <text x={cX2} y={cY + 26} textAnchor="middle" className="text-[9px] font-mono font-extrabold fill-orange-600">{jurosAnualizado.toFixed(1)}% a.a.</text>

        {/* Decisão / Parecer no Centro Superior */}
        <rect x="15" y="2" width="170" height="15" rx="4" fill={aVistaVantajoso ? "#ecfdf5" : "#eff6ff"} stroke={aVistaVantajoso ? "#10b981" : "#3b82f6"} strokeWidth="0.8" />
        <text x="100" y="12" textAnchor="middle" className={`text-[7.5px] font-extrabold ${aVistaVantajoso ? "fill-emerald-800" : "fill-blue-800"}`}>
          RECOMENDADO: {aVistaVantajoso ? "COMPRAR À VISTA" : "COMPRAR A PRAZO"}
        </text>
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
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Planejador de Compras (À Vista vs. Prazo)</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Juros Implícitos, CDI e Custo de Oportunidade de Insumos — Gestão Financeira
                <Link href="/ajuda#planejador-compras" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
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
            
            {/* Bloco 1: Proposta do Fornecedor */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">1. Proposta Comercial</h2>
                <p className="text-xs text-neutral-500 mt-1">Insira os termos de pagamento oferecidos pela revenda ou cooperativa</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Preço Total a Prazo (R$)</label>
                  <input
                    type="number"
                    value={valorPrazo}
                    onChange={(e) => setValorPrazo(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Prazo de Pagamento (dias)</label>
                  <input
                    type="number"
                    value={prazoDias}
                    onChange={(e) => setPrazoDias(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              {/* Seletor do Modo à Vista */}
              <div className="bg-neutral-100 p-1.5 rounded-xl flex gap-1">
                <button
                  type="button"
                  onClick={() => setModoVista("desconto")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center transition-all ${
                    modoVista === "desconto" ? "bg-white text-emerald-800 shadow-sm" : "text-neutral-600"
                  }`}
                >
                  Desconto à Vista (%)
                </button>
                <button
                  type="button"
                  onClick={() => setModoVista("valor")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center transition-all ${
                    modoVista === "valor" ? "bg-white text-emerald-800 shadow-sm" : "text-neutral-600"
                  }`}
                >
                  Valor à Vista Direto (R$)
                </button>
              </div>

              <div>
                {modoVista === "desconto" ? (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Desconto Comercial à Vista (%)</label>
                    <input
                      type="number"
                      value={descontoVista}
                      onChange={(e) => setDescontoVista(Number(e.target.value))}
                      min={0}
                      max={100}
                      step={0.5}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-emerald-850"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Valor Comercial à Vista (R$)</label>
                    <input
                      type="number"
                      value={valorVistaInput}
                      onChange={(e) => setValorVistaInput(Number(e.target.value))}
                      min={1}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-emerald-850"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Custo de Oportunidade */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">2. Custo de Oportunidade do Capital</h2>
                <p className="text-xs text-neutral-500 mt-1">Taxa de rendimento de investimentos conservadores livres de risco</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Rentabilidade Anual de Referência (ex: CDI % a.a.)</label>
                <input
                  type="number"
                  value={taxaOportunidadeAno}
                  onChange={(e) => setTaxaOportunidadeAno(Number(e.target.value))}
                  min={0.1}
                  step={0.1}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold text-emerald-800"
                />
              </div>
            </div>

            {/* Bloco 3: Laudo Técnico */}
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
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Recomendação Comercial</p>
                <p className="text-2xl font-extrabold tracking-tight">
                  {aVistaVantajoso ? "✓ Comprar à Vista" : "✓ Comprar a Prazo"}
                </p>
                
                <p className="text-emerald-400 text-xs mt-1">
                  Ganho Real Líquido: <span className="font-bold text-white">R$ {ganhoLiquido.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-emerald-900">
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Juros do Prazo (a.a.)</p>
                    <p className="text-lg font-extrabold text-white">
                      {jurosAnualizado.toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-emerald-300">
                      Taxa implícita anual
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Rendimento CDI (a.a.)</p>
                    <p className="text-lg font-extrabold text-white">
                      {taxaOportunidadeAno.toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-emerald-300">
                      Custo de oportunidade
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-900 text-xs text-emerald-300">
                  <p>• À Vista Líquido: **R$ {valorVista.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}**</p>
                  <p className="mt-0.5">• Prazo Líquido Real: **R$ {custoRealPrazo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}**</p>
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
              <h3 className="font-bold text-sm text-neutral-800">Comparador de Taxas</h3>
              <div className="bg-neutral-50 rounded-xl p-2">
                {renderSvgComparativo()}
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
              <span className="text-emerald-800 font-bold block mb-1">1. Taxa de Juros Implícita no Prazo:</span>
              Fórmula Juros do Período: i_período = (Valor a Prazo / Valor à Vista) - 1
              <br />
              i_período = ({valorPrazo.toLocaleString("pt-BR")} / {valorVista.toLocaleString("pt-BR")}) - 1 = {(jurosPeriodo * 100).toFixed(4)}% para {prazoDias} dias.
              <br />
              <br />
              Anualização Efetiva (Composta): i_anual = [(1 + i_período) ^ (365 / Prazo_dias) - 1] × 100
              <br />
              i_anual = [(1 + {jurosPeriodo.toFixed(5)}) ^ (365 / {prazoDias}) - 1] × 100 = <span className="font-bold text-emerald-850">{jurosAnualizado.toFixed(4)}% a.a.</span>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">2. Equivalente do Custo de Oportunidade (CDI):</span>
              Fórmula CDI do Período: cdi_período = (1 + CDI_Ano/100) ^ (Prazo_dias / 365) - 1
              <br />
              cdi_período = (1 + {taxaOportunidadeAno / 100}) ^ ({prazoDias} / 365) - 1 = {(oportunidadePeriodo * 100).toFixed(4)}% no período.
              <br />
              <br />
              Rendimento Acumulado Financeiro = Valor à Vista × cdi_período
              <br />
              Rendimento = {valorVista.toLocaleString("pt-BR")} × {(oportunidadePeriodo * 100).toFixed(4)}% = <span className="font-bold">R$ {rendimentoR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">3. Custo Real da Compra a Prazo:</span>
              Custo Líquido Real = Valor a Prazo - Rendimento Acumulado
              <br />
              Custo Líquido Real = {valorPrazo.toLocaleString("pt-BR")} - {rendimentoR.toFixed(2)} = <span className="font-bold">{custoRealPrazo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <br />
              <br />
              Comparação com a Compra à Vista (R$ {valorVista.toLocaleString("pt-BR")}):
              <br />
              Diferença Líquida = | {valorVista.toLocaleString("pt-BR")} - {custoRealPrazo.toLocaleString("pt-BR")} | = <span className="font-bold text-emerald-800">R$ {ganhoLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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
              Laudo Comparativo: Compra à Vista vs. Prazo
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
                    <th className="p-2 text-right font-bold text-emerald-900 border border-emerald-200">Valor / Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-neutral-200">Valor Comercial a Prazo</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {valorPrazo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Valor Comercial à Vista</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {valorVista.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Prazo de Vencimento</td><td className="p-2 text-right font-bold border border-neutral-200">{prazoDias} dias</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Rendimento de Referência (CDI)</td><td className="p-2 text-right font-bold border border-neutral-200">{taxaOportunidadeAno.toFixed(2)}% a.a.</td></tr>
                  
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Juros do Prazo (Implícito)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">{jurosAnualizado.toFixed(2)}% a.a.</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Rendimento Estimado CDI no Período</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">R$ {rendimentoR.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Custo Real da Opção a Prazo</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">R$ {custoRealPrazo.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Cenário Recomendado</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">{aVistaVantajoso ? "Comprar à Vista" : "Comprar a Prazo"}</td>
                  </tr>
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Ganho Líquido Real</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">R$ {ganhoLiquido.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
                  </tr>

                  <tr><td className="p-2 border border-neutral-200">Responsável Técnico</td><td className="p-2 text-right font-bold border border-neutral-200">{responsavel}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Produtor / Cliente</td><td className="p-2 text-right font-bold border border-neutral-200">{cliente}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Diagrama Visual */}
            <div className="flex flex-col items-center justify-start pt-4">
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Mostradores de Taxas Comparativos</h3>
              <div className="w-full max-w-[250px] shadow-sm border border-neutral-200 rounded-xl overflow-hidden p-2 bg-white">
                {renderSvgComparativo()}
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
