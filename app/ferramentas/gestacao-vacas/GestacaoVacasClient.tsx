"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Scale, Calendar } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface GestacaoVacasClientProps {
  isPro: boolean;
  userName?: string;
}

// Helpers de datas
const formatarData = (date: Date) => {
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const ano = date.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
};

const obterDataInput = (diasAtras: number) => {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().split("T")[0];
};

export default function GestacaoVacasClient({ isPro, userName }: GestacaoVacasClientProps) {
  // Identificação do Animal
  const [brincoVaca, setBrincoVaca] = useState<string>("Vaca 101");
  const [aptidao, setAptidao] = useState<"leite" | "corte">("leite");

  // Parâmetros de Datas (Formatados como DD/MM/AAAA)
  const obterDataInicial = (diasAtras: number) => {
    const d = new Date();
    d.setDate(d.getDate() - diasAtras);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const [dataInseminacaoTxt, setDataInseminacaoTxt] = useState<string>(obterDataInicial(180));
  const [dataReferenciaTxt, setDataReferenciaTxt] = useState<string>(obterDataInicial(0));

  // Laudo Técnico
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");
  const [showValidationError, setShowValidationError] = useState<boolean>(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // Auxiliares de Máscara e Conversão
  const aplicarMascaraData = (val: string) => {
    const digitos = val.replace(/\D/g, "");
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4, 8)}`;
  };

  const converterParaData = (txt: string) => {
    const partes = txt.split("/");
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const ano = parseInt(partes[2], 10);
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano) && partes[2].length === 4) {
        return new Date(Date.UTC(ano, mes, dia, 12, 0, 0));
      }
    }
    return new Date(NaN);
  };

  const start = converterParaData(dataInseminacaoTxt);
  const ref = converterParaData(dataReferenciaTxt);

  const isDataInseminacaoValida = !isNaN(start.getTime());
  const isDataReferenciaValida = !isNaN(ref.getTime());
  const datasInvalidas = !isDataInseminacaoValida || !isDataReferenciaValida;

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "" && !datasInvalidas;

  // ======================================================
  // PROCESSAMENTO DE CÁLCULO GESTACIONAL
  // ======================================================
  const diffTime = !datasInvalidas ? ref.getTime() - start.getTime() : 0;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const dppDate = new Date(isDataInseminacaoValida ? start.getTime() : Date.now());
  if (isDataInseminacaoValida) {
    dppDate.setDate(dppDate.getDate() + 283);
  }

  const diasRestantes = 283 - diffDays;
  const mesesGestacao = diffDays / 30.4;
  const semanasGestacao = diffDays / 7;

  // Validações
  const erroInseminacaoFutura = !datasInvalidas && diffDays < 0;
  const alertaGestacaoAvancada = !datasInvalidas && diffDays > 290;

  // Definição dos marcos de manejo
  const MARCOS = [
    {
      id: "secagem",
      nome: "Secagem da Vaca (Descanso Mamário)",
      diaGestacao: 223,
      diasAntesParto: 60,
      aplicavel: aptidao === "leite",
      descricao: "Interrupção completa da ordenha para regeneração do tecido mamário e colostrogênese.",
    },
    {
      id: "vacina_1",
      nome: "Vacinação Pré-Parto (1ª Dose / Reforço)",
      diaGestacao: 238,
      diasAntesParto: 45,
      aplicavel: true,
      descricao: "Vacina contra diarreias neonatais (Rotavírus, Coronavírus e E. coli) para imunidade via colostro.",
    },
    {
      id: "vacina_2",
      nome: "Vacinação Pré-Parto (2ª Dose / Reforço Opcional)",
      diaGestacao: 253,
      diasAntesParto: 30,
      aplicavel: true,
      descricao: "Dose de reforço anual ou de segunda dose de protocolo primário vacinal.",
    },
    {
      id: "dieta",
      nome: "Entrada na Dieta de Transição (Sais Aniônicos)",
      diaGestacao: 262,
      diasAntesParto: 21,
      aplicavel: true,
      descricao: "Ajuste na nutrição (ração aniônica) para prevenir hipocalcemia (Febre do Leite) e cetose pós-parto.",
    },
  ];

  // Cálculo das datas específicas de cada marco
  const calcularDataMarco = (diaGest: number) => {
    if (datasInvalidas) return new Date();
    const d = new Date(start.getTime());
    d.setDate(d.getDate() + diaGest);
    return d;
  };

  const obterStatusMarco = (diaGest: number) => {
    if (datasInvalidas) return { texto: "Aguardando", cor: "text-neutral-400 bg-neutral-50 border-neutral-200" };
    if (erroInseminacaoFutura) return { texto: "Aguardando", cor: "text-neutral-400 bg-neutral-50 border-neutral-200" };
    
    const diasFaltam = diaGest - diffDays;
    
    if (diasFaltam > 7) {
      return { 
        texto: `A realizar (Faltam ${diasFaltam} dias)`, 
        cor: "text-blue-600 bg-blue-50 border-blue-200" 
      };
    } else if (diasFaltam >= 0 && diasFaltam <= 7) {
      return { 
        texto: `⚠️ Executar Agora! (Faltam ${diasFaltam} dias)`, 
        cor: "text-amber-800 bg-amber-50 border-amber-300 font-bold animate-pulse" 
      };
    } else {
      return { 
        texto: "✓ Período já iniciado / Concluído", 
        cor: "text-emerald-700 bg-emerald-50 border-emerald-200" 
      };
    }
  };

  // ======================================================
  // GERAÇÃO DE PDF E IMPRESSÃO
  // ======================================================
  const handleImprimir = () => {
    if (!isPro) {
      window.location.href = "/#planos";
      return;
    }
    if (!isFormValid || erroInseminacaoFutura) {
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
    if (!isFormValid || erroInseminacaoFutura) {
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
      pdf.save(`Gestacao-Vaca-${brincoVaca}-${cliente || "Laudo"}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  // ======================================================
  // SVGs TIMELINE DE GESTAÇÃO DINÂMICA
  // ======================================================
  const renderSvgTimeline = () => {
    const w = 280;
    const h = 80;
    const padding = 20;
    const lineY = 40;
    const lineW = w - 2 * padding;

    // Calcular percentual de progresso gestacional limitado de 0 a 100%
    const progress = Math.min(Math.max(diffDays / 283, 0), 1);
    const cursorX = padding + progress * lineW;

    // Marcos para a régua
    const marcosLinha = [
      { x: padding, label: "0d", desc: "Insem.", pos: "cima" },
      { x: padding + (223 / 283) * lineW, label: "223d", desc: "Secagem", show: aptidao === "leite", pos: "baixo" },
      { x: padding + (238 / 283) * lineW, label: "238d", desc: "Vacina", pos: "cima" },
      { x: padding + (262 / 283) * lineW, label: "262d", desc: "Dieta", pos: "baixo" },
      { x: padding + lineW, label: "283d", desc: "Parto", pos: "cima" },
    ];

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full mx-auto">
        {/* Linha base */}
        <line x1={padding} y1={lineY} x2={padding + lineW} y2={lineY} stroke="#e5e7eb" strokeWidth="6" strokeLinecap="round" />
        {/* Linha preenchida com progresso */}
        {diffDays > 0 && (
          <line x1={padding} y1={lineY} x2={cursorX} y2={lineY} stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
        )}

        {/* Desenho dos Pontos de Marcos */}
        {marcosLinha.filter(m => m.show !== false).map((m, idx) => {
          const isAcima = m.pos === "cima";
          return (
            <g key={idx}>
              <circle cx={m.x} cy={lineY} r="5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
              <text 
                x={m.x} 
                y={isAcima ? lineY - 18 : lineY + 14} 
                textAnchor="middle" 
                className="text-[6.5px] font-bold fill-neutral-700"
              >
                {m.desc}
              </text>
              <text 
                x={m.x} 
                y={isAcima ? lineY - 10 : lineY + 22} 
                textAnchor="middle" 
                className="text-[5.5px] fill-neutral-400 font-mono"
              >
                {m.label}
              </text>
            </g>
          );
        })}

        {/* Cursor / Indicador Atual */}
        {!erroInseminacaoFutura && (
          <g transform={`translate(${cursorX}, ${lineY})`}>
            {/* Linha de prumo */}
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#ef4444" strokeWidth="1.5" />
            {/* Triângulo indicador */}
            <path d="M-4,-8 L4,-8 L0,-4 Z" fill="#ef4444" />
            {/* Texto dias */}
            <rect x="-15" y="-23" width="30" height="11" rx="2" fill="#ef4444" />
            <text x="0" y="-15" textAnchor="middle" className="text-[7px] font-extrabold fill-white font-mono">
              {diffDays}d
            </text>
          </g>
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
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Idade Gestacional e Alerta de Manejo para Vacas</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                DPP, Período de Secagem e Cronograma Vacinal Pré-Parto — Pecuária & Silagem
                <Link href="/ajuda#gestacao-vacas" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
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
                  disabled={!isFormValid || erroInseminacaoFutura}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={handleGerarPdf}
                  disabled={!isFormValid || erroInseminacaoFutura || gerandoPdf}
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
          {/* COLUNA ESQUERDA: INPUTS E TABELA (7 colunas) */}
          {/* ============================================ */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Bloco 1: Cadastro e Aptidão */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">1. Cadastro da Doadora / Matriz</h2>
                <p className="text-xs text-neutral-500 mt-1">Identifique o animal e sua respectiva aptidão produtiva</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Identificação (Brinco/Nome)</label>
                  <input
                    type="text"
                    value={brincoVaca}
                    onChange={(e) => setBrincoVaca(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Aptidão Produtiva</label>
                  <select
                    value={aptidao}
                    onChange={(e) => setAptidao(e.target.value as "leite" | "corte")}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    <option value="leite">Leiteira (Requer Secagem)</option>
                    <option value="corte">Corte (Cria/Reprodução)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 2: Parâmetros de Calendário */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">2. Cronologia de Cobertura</h2>
                <p className="text-xs text-neutral-500 mt-1">Insira a data do evento reprodutivo e a data de referência para cálculo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Data da Inseminação / Cobertura</label>
                  <input
                    type="text"
                    value={dataInseminacaoTxt}
                    onChange={(e) => setDataInseminacaoTxt(aplicarMascaraData(e.target.value))}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-mono"
                  />
                  {!isDataInseminacaoValida && (
                    <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                      ⚠️ Data inválida (Use: DD/MM/AAAA)
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Data de Referência (Simulação)</label>
                  <input
                    type="text"
                    value={dataReferenciaTxt}
                    onChange={(e) => setDataReferenciaTxt(aplicarMascaraData(e.target.value))}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-mono"
                  />
                  {!isDataReferenciaValida && (
                    <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                      ⚠️ Data inválida (Use: DD/MM/AAAA)
                    </span>
                  )}
                </div>
              </div>

              {erroInseminacaoFutura && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                  ⚠️ A data de referência é anterior à data da cobertura. Por favor, ajuste os calendários.
                </div>
              )}
              {alertaGestacaoAvancada && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                  ⚠️ O período estimado de gestação excedeu 290 dias. Espera-se que o parto já tenha ocorrido.
                </div>
              )}
            </div>

            {/* Bloco 3: Tabela de Cronograma de Manejo */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">3. Calendário de Alertas e Manejos</h2>
                <p className="text-xs text-neutral-500 mt-1">Datas programadas com base no período restante para o parto</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-neutral-200 rounded-xl overflow-hidden">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="p-3 font-bold text-neutral-700">Manejo Recomendado</th>
                      <th className="p-3 font-bold text-neutral-700 text-center">Data Recomendada</th>
                      <th className="p-3 font-bold text-neutral-700 text-center">Idade Gest.</th>
                      <th className="p-3 font-bold text-neutral-700 text-center">Status do Alerta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {MARCOS.filter(m => m.aplicavel).map((m) => {
                      const dataM = calcularDataMarco(m.diaGestacao);
                      const statusM = obterStatusMarco(m.diaGestacao);
                      return (
                        <tr key={m.id} className="hover:bg-neutral-50/50">
                          <td className="p-3">
                            <span className="font-bold text-neutral-800 block">{m.nome}</span>
                            <span className="text-[10px] text-neutral-500 mt-0.5 block leading-normal">{m.descricao}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-neutral-700">
                            {formatarData(dataM)}
                          </td>
                          <td className="p-3 text-center text-neutral-500 font-mono">
                            {m.diaGestacao}d
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] border ${statusM.cor}`}>
                              {statusM.texto}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Previsão do Parto (DPP)</p>
                <p className="text-4xl font-extrabold tracking-tight">
                  {erroInseminacaoFutura ? "Calendário Inválido" : formatarData(dppDate)}
                </p>
                
                <p className="text-emerald-400 text-xs mt-1">
                  ID Matriz: <span className="font-bold text-white">{brincoVaca}</span> ({aptidao === "leite" ? "Leiteira" : "Corte"})
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-emerald-900">
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Idade Gestacional</p>
                    <p className="text-lg font-extrabold text-white">
                      {erroInseminacaoFutura ? "-" : `${diffDays} dias`}
                    </p>
                    {!erroInseminacaoFutura && (
                      <p className="text-[10px] text-emerald-300 mt-0.5 font-medium">
                        ~ {mesesGestacao.toFixed(1)} meses
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Status Parto</p>
                    <p className="text-lg font-extrabold text-white">
                      {erroInseminacaoFutura ? "-" : diasRestantes > 0 ? `Faltam ${diasRestantes}d` : "Nascido / Parto"}
                    </p>
                    {!erroInseminacaoFutura && diasRestantes > 0 && (
                      <p className="text-[10px] text-emerald-300 mt-0.5 font-medium">
                        {semanasGestacao.toFixed(1)} sem. gestação
                      </p>
                    )}
                  </div>
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
              <h3 className="font-bold text-sm text-neutral-800">Timeline Reprodutiva</h3>
              <div className="bg-neutral-50 rounded-xl p-2">
                {renderSvgTimeline()}
              </div>
              <div className="text-[11px] text-neutral-500 leading-relaxed">
                A régua gestacional ilustra a progressão (verde) de 0 a 283 dias, localizando o estágio atual do animal em relação aos manejos de Secagem (223d), Vacinação (238d) e Dieta de Transição (262d).
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
            Memória de Cálculo e Diretrizes Técnicas
          </h2>
          <div className="font-mono text-xs text-neutral-700 space-y-4 bg-neutral-50 rounded-xl p-5">
            <div>
              <span className="text-emerald-800 font-bold block mb-1">1. Equação do Parto (DPP):</span>
              Data Provável do Parto (DPP) = Data da Cobertura + 283 dias
              <br />
              DPP = {formatarData(start)} + 283 = <span className="font-bold">{formatarData(dppDate)}</span>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">2. Prazos Recomendados para Intervenção:</span>
              - **Secagem da Matriz (Bovinos de Leite)**: Ocorre no 223º dia de gestação (60 dias pré-parto). Visa a involução do tecido mamário e colostrogênese secundária.
              <br />
              - **Vacinação Pré-Parto**: Realizada entre 45 e 30 dias pré-parto (dias 238 e 253 de gestação). Assegura altas taxas de imunoglobulinas no colostro, garantindo a proteção do bezerro contra diarreia neonatal e pneumonias.
              <br />
              - **Dieta de Transição**: Iniciada a 21 dias pré-parto (dia 262 de gestação). Consiste na alimentação com balanço cátion-aniônico negativo para forçar o metabolismo mineral da vaca a secretar paratormônio, prevenindo a hipocalcemia subclínica e retenção de placenta.
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
              Cronograma de Manejo Reprodutivo e Sanitário
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
                    <th className="p-2 text-left font-bold text-emerald-900 border border-emerald-200">Parâmetro Reprodutivo</th>
                    <th className="p-2 text-right font-bold text-emerald-900 border border-emerald-200">Valor / Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-neutral-200">Identificação Animal (Brinco)</td><td className="p-2 text-right font-bold border border-neutral-200">{brincoVaca}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Aptidão / Tipo</td><td className="p-2 text-right font-bold border border-neutral-200">{aptidao === "leite" ? "Leiteira (Ordenha)" : "Corte (Reprodução)"}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Data de Inseminação / Cobertura</td><td className="p-2 text-right font-bold border border-neutral-200">{formatarData(start)}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Data de Referência</td><td className="p-2 text-right font-bold border border-neutral-200">{formatarData(ref)}</td></tr>
                  
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Idade Gestacional</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">{diffDays} dias ({mesesGestacao.toFixed(1)} meses)</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Data Provável do Parto (DPP)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-850 border border-emerald-200">{formatarData(dppDate)}</td>
                  </tr>

                  {/* Detalhes de Calendário */}
                  {MARCOS.filter(m => m.aplicavel).map((m) => {
                    const dataM = calcularDataMarco(m.diaGestacao);
                    return (
                      <tr key={m.id}>
                        <td className="p-2 border border-neutral-200">{m.nome}</td>
                        <td className="p-2 text-right font-bold border border-neutral-200 text-neutral-700">{formatarData(dataM)} (dia {m.diaGestacao})</td>
                      </tr>
                    );
                  })}

                  <tr><td className="p-2 border border-neutral-200">Responsável Técnico</td><td className="p-2 text-right font-bold border border-neutral-200">{responsavel}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Produtor / Cliente</td><td className="p-2 text-right font-bold border border-neutral-200">{cliente}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Diagrama Visual */}
            <div className="flex flex-col items-center justify-start pt-4">
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Régua Cronológica de Gestação</h3>
              <div className="w-full max-w-[250px] shadow-sm border border-neutral-200 rounded-xl overflow-hidden p-2">
                {renderSvgTimeline()}
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
