"use client";

import { useState, useRef, useEffect } from "react";

import Link from "next/link";
import { Calculator, FileText, Info, HelpCircle, Printer, ArrowLeft, Lock, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function QuebraUmidadeClient({ isPro = false, userName }: { isPro?: boolean, userName?: string }) {
  // Inputs
  const [pesoInicial, setPesoInicial] = useState<number>(30000);
  const [umidadeInicial, setUmidadeInicial] = useState<number>(18);
  const [umidadeDesejada, setUmidadeDesejada] = useState<number>(14);
  const [impurezaInicial, setImpurezaInicial] = useState<number>(2.5);
  const [impurezaTolerada, setImpurezaTolerada] = useState<number>(1.0);
  const [precoSaca, setPrecoSaca] = useState<number>(120);

  // Laudo Técnico (Obrigatórios)
  const [produtor, setProdutor] = useState<string>("");
  const [responsavelTecnico, setResponsavelTecnico] = useState<string>(userName || "");
  const [showValidationError, setShowValidationError] = useState<boolean>(false);

  const reportRef = useRef<HTMLDivElement>(null);

  // Proteção Anti-PrintScreen e Anti-Cópia para Usuários Grátis
  useEffect(() => {
    if (isPro) return;

    // 1. Bloquear tecla PrintScreen e limpar a área de transferência
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        try {
          navigator.clipboard?.writeText("");
        } catch (err) {}
        alert("🔒 A captura de tela deste relatório é bloqueada no Plano Gratuito. Assine o Plano Pro para emitir e baixar o laudo em PDF!");
      }
    };

    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, [isPro]);

  // Cálculos Agronômicos
  const pesoAposSecagem = pesoInicial * ((100 - umidadeInicial) / (100 - umidadeDesejada));
  const quebraUmidadeKg = Math.max(0, pesoInicial - pesoAposSecagem);

  const impurezaExcedente = Math.max(0, impurezaInicial - impurezaTolerada);
  const descontoImpurezaKg = pesoAposSecagem * (impurezaExcedente / 100);
  
  const pesoFinalLiquido = Math.max(0, pesoAposSecagem - descontoImpurezaKg);
  const quebraTotalKg = pesoInicial - pesoFinalLiquido;

  const sacasIniciais = pesoInicial / 60;
  const sacasFinais = pesoFinalLiquido / 60;
  const sacasPerdidas = sacasIniciais - sacasFinais;

  const valorTotalInicial = sacasIniciais * precoSaca;
  const valorTotalLiquido = sacasFinais * precoSaca;
  const prejuizoFinanceiro = valorTotalInicial - valorTotalLiquido;

  const pctLimpo = (pesoFinalLiquido / pesoInicial) * 100;
  const pctAgua = (quebraUmidadeKg / pesoInicial) * 100;
  const pctImpureza = (descontoImpurezaKg / pesoInicial) * 100;

  // Validação dos Campos Obrigatórios
  const isFormValid = produtor.trim() !== "" && responsavelTecnico.trim() !== "";

  // Exportar para PDF
  const handleExportPDF = async () => {
    if (!isPro) {
      window.location.href = "/#planos";
      return;
    }
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);

    if (!reportRef.current) return;
    
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; 
      const pageHeight = 295; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`laudo-quebra-umidade-${produtor.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um problema ao gerar o PDF.");
    }
  };

  // Impressão Direta
  const handlePrint = () => {
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
              Simulador de Quebra de Umidade
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Calcule a perda de peso por secagem de água e excesso de impurezas.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {isPro ? (
              <>
                <button
                  onClick={handlePrint}
                  disabled={!isFormValid}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={!isFormValid}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Gerar PDF
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

              <h2 className="font-bold text-lg text-neutral-800 border-b pb-3 border-neutral-100">
                Parâmetros da Carga
              </h2>

              <div className="space-y-4">
                {/* Peso Inicial */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Peso Inicial da Carga (kg)
                  </label>
                  <input
                    type="number"
                    value={pesoInicial || ""}
                    onChange={(e) => setPesoInicial(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
                  />
                </div>

                {/* Grid de Umidade */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">
                      Umidade Inicial (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={umidadeInicial || ""}
                      onChange={(e) => setUmidadeInicial(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">
                      Umidade Padrão (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={umidadeDesejada || ""}
                      onChange={(e) => setUmidadeDesejada(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
                    />
                  </div>
                </div>

                {/* Grid de Impurezas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">
                      Impureza Carga (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={impurezaInicial || ""}
                      onChange={(e) => setImpurezaInicial(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">
                      Tolerância Impureza (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={impurezaTolerada || ""}
                      onChange={(e) => setImpurezaTolerada(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
                    />
                  </div>
                </div>

                {/* Preço da Saca */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Preço da Saca (R$ / 60kg)
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 text-xs">R$</span>
                    </div>
                    <input
                      type="number"
                      value={precoSaca || ""}
                      onChange={(e) => setPrecoSaca(Math.max(0, Number(e.target.value)))}
                      className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl pl-9 pr-3 py-2 text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Informações obrigatórias para o laudo */}
              <div className="pt-4 border-t border-neutral-100 space-y-4">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1">
                  Laudo Técnico <span className="text-red-500 font-bold">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Responsável Técnico *</label>
                    <input
                      type="text"
                      placeholder="Nome do agrônomo ou técnico"
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
                      type="text"
                      placeholder="Nome do produtor ou fazenda"
                      value={produtor}
                      onChange={(e) => {
                        setProdutor(e.target.value);
                        if(e.target.value.trim() !== "" && responsavelTecnico.trim() !== "") setShowValidationError(false);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && produtor.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
                    />
                  </div>
                </div>
                {showValidationError && (
                  <p className="text-[11px] font-medium text-red-600 animate-pulse mt-1">
                    ⚠️ O campo Produtor / Cliente é obrigatório.
                  </p>
                )}
              </div>
            </div>

          {/* Coluna da Direita: Resultados (5 colunas) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-6 space-y-6">
              
              {/* Card de Peso Final Principal */}
              <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900 rounded-full blur-2xl opacity-40 -mr-8 -mt-8" />
                
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider block">
                  Peso Final Líquido
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {pesoFinalLiquido.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </span>
                  <span className="text-lg text-emerald-300 font-semibold">kg</span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-emerald-900 pt-4 text-sm mb-6">
                  <div>
                    <span className="text-emerald-400 text-xs block">Sacas Líquidas (60kg)</span>
                    <span className="font-bold text-lg mt-0.5 block">
                      {sacasFinais.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-xs block">Valor Estimado Líquido</span>
                    <span className="font-bold text-lg mt-0.5 block text-emerald-200">
                      {valorTotalLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>

                {!isPro ? null : !isFormValid ? (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha o Produtor / Cliente para emitir o Laudo.
                  </div>
                ) : null}
              </div>

              {/* Detalhamento das Perdas */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-neutral-850 text-base">
                    Composição da Carga
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
                          strokeDasharray={`${pctLimpo} ${100 - pctLimpo}`}
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
                          strokeDasharray={`${pctAgua} ${100 - pctAgua}`}
                          strokeDashoffset={`-${pctLimpo}`}
                          className="transition-all duration-300"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#b45309"
                          strokeWidth="3.2"
                          strokeDasharray={`${pctImpureza} ${100 - pctImpureza}`}
                          strokeDashoffset={`-${pctLimpo + pctAgua}`}
                          className="transition-all duration-300"
                        />
                        <text x="18" y="16.5" fontFamily="sans-serif" fontSize="6" fontWeight="800" fill="#262626" textAnchor="middle" dominantBaseline="central" transform="rotate(90 18 18)">
                          {pctLimpo.toFixed(0)}%
                        </text>
                        <text x="18" y="22" fontFamily="sans-serif" fontSize="2.5" fontWeight="700" fill="#a3a3a3" textAnchor="middle" dominantBaseline="central" transform="rotate(90 18 18)">
                          APROVEITÁVEL
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Legendas */}
                  <div className="md:col-span-7 space-y-4 text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Grãos Limpos</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-neutral-900 block">
                          {pesoFinalLiquido.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
                        </span>
                        <span className="text-xs text-neutral-400">({pctLimpo.toFixed(1)}% da carga)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Quebra de Água</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600 block">
                          -{quebraUmidadeKg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
                        </span>
                        <span className="text-xs text-neutral-400">({pctAgua.toFixed(1)}% da carga)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-amber-700 shrink-0" />
                        <span className="font-medium text-neutral-700">Desconto Impurezas</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-700 block">
                          -{descontoImpurezaKg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
                        </span>
                        <span className="text-xs text-neutral-400">({pctImpureza.toFixed(1)}% da carga)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financeiro e Prejuízo */}
              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-xl text-amber-800">
                  <Info className="h-6 w-6" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <h4 className="font-bold text-amber-900">Resumo da Perda Financeira</h4>
                  <p className="text-amber-800 leading-relaxed">
                    O teor de umidade original e o excesso de impurezas acima da tolerância de {impurezaTolerada}% reduziram a sua carga em <span className="font-bold">{quebraTotalKg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</span>. Isso representa um impacto financeiro estimado de <span className="font-bold text-amber-900">{prejuizoFinanceiro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Memória de Cálculo */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-neutral-800 flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-emerald-800" />
              Memória de Cálculo Agronômico
            </h3>
            <div className="text-sm text-neutral-600 space-y-4 leading-relaxed">
              <p>
                As cooperativas e cerealistas utilizam equações padrão de conservação de matéria seca para descontar o peso da água contida nos grãos antes de processá-los na secadora.
              </p>
              
              <div className="bg-neutral-50 p-4 rounded-xl space-y-3 font-mono text-xs text-neutral-700">
                <div>
                  <span className="text-emerald-800 font-bold block mb-1">1. Fórmula da Quebra de Umidade (Peso Pós-Secagem):</span>
                  Peso Pós-Secagem = Peso Inicial * ((100 - Umidade Inicial) / (100 - Umidade Desejada))
                  <br />
                  <span className="text-neutral-400">Ex:</span> {pesoInicial} * ((100 - {umidadeInicial}) / (100 - {umidadeDesejada})) = {pesoAposSecagem.toFixed(1)} kg
                </div>
                
                {impurezaInicial > impurezaTolerada && (
                  <div className="pt-3 border-t border-neutral-200">
                    <span className="text-amber-850 font-bold block mb-1">2. Desconto de Impurezas Excedentes:</span>
                    Impureza Excedente = {impurezaInicial}% - {impurezaTolerada}% = {impurezaExcedente}%
                    <br />
                    Desconto = Peso Pós-Secagem * ({impurezaExcedente}% / 100) = {descontoImpurezaKg.toFixed(1)} kg
                  </div>
                )}
                
                <div className="pt-3 border-t border-neutral-200">
                  <span className="text-neutral-900 font-bold block mb-1">3. Peso Final Líquido:</span>
                  Peso Final = {pesoAposSecagem.toFixed(1)} kg {descontoImpurezaKg > 0 ? `- ${descontoImpurezaKg.toFixed(1)} kg (impurezas)` : ""} = {pesoFinalLiquido.toFixed(1)} kg
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé Unificado */}
      <div className="no-print">
        <Footer />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ----------------- ESTRUTURA PARA PDF/PRINT ------------------- */}
      {/* ------------------------------------------------------------- */}
      {isPro && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div id="pdf-content" ref={reportRef} className="w-[210mm] bg-white text-neutral-900 p-10 font-sans print-only-container min-h-[270mm] flex flex-col">
          {/* Corpo do Documento */}
          <div className="space-y-6">
            
            {/* Topo do Laudo / Cabeçalho com Espaço Adicional (Ajustado) */}
            <div className="flex justify-between items-center border-b pb-6 border-neutral-200">
              <div className="space-y-2">
                <span className="text-3xl font-extrabold text-emerald-850 tracking-tight block">
                  Talhão<span className="text-emerald-600">Digital</span>
                </span>
                <span className="text-xs text-neutral-400 block mt-2">
                  Laudos e Diagnósticos Agronômicos de Precisão
                </span>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <span className="block font-bold">Relatório Técnico Digital</span>
                <span className="block mt-0.5" suppressHydrationWarning>{new Date().toLocaleDateString("pt-BR")}</span>
              </div>
            </div>

            {/* Dados do Responsável Técnico e Produtor */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-400 block font-semibold uppercase">Responsável Técnico</span>
                <span className="text-sm font-bold text-neutral-800 mt-0.5 block">{responsavelTecnico}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-semibold uppercase">Produtor / Cliente</span>
                <span className="text-sm font-bold text-neutral-800 mt-0.5 block">{produtor}</span>
              </div>
            </div>

            {/* Título Principal */}
            <div>
              <h2 className="text-lg font-bold text-neutral-900 border-b pb-2 border-neutral-200">
                Laudo Técnico de Quebra de Carga
              </h2>
            </div>

            {/* Grid contendo a Tabela de Parâmetros e o Gráfico de Composição no PDF */}
            <div className="grid grid-cols-12 gap-6 items-center">
              
              {/* Tabela (7 colunas) */}
              <div className="col-span-8">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700">
                      <th className="p-2 font-bold">Parâmetro</th>
                      <th className="p-2 font-bold text-right">Informado</th>
                      <th className="p-2 font-bold text-right">Desconto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr>
                      <td className="p-2">Peso Inicial da Carga</td>
                      <td className="p-2 text-right font-bold">{pesoInicial.toLocaleString("pt-BR")} kg</td>
                      <td className="p-2 text-right text-neutral-400">-</td>
                    </tr>
                    <tr>
                      <td className="p-2">Umidade de Entrada</td>
                      <td className="p-2 text-right font-bold">{umidadeInicial.toFixed(1)}%</td>
                      <td className="p-2 text-right text-neutral-500">Desejada: {umidadeDesejada.toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="p-2">Impurezas de Entrada</td>
                      <td className="p-2 text-right font-bold">{impurezaInicial.toFixed(1)}%</td>
                      <td className="p-2 text-right text-neutral-500">Tolerada: {impurezaTolerada.toFixed(1)}%</td>
                    </tr>
                    <tr className="bg-blue-50/50 text-blue-900 font-semibold">
                      <td className="p-2">Quebra por Secagem (Água)</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">-{quebraUmidadeKg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</td>
                    </tr>
                    <tr className="bg-amber-50/50 text-amber-900 font-semibold">
                      <td className="p-2">Desconto de Impurezas</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">-{descontoImpurezaKg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</td>
                    </tr>
                    <tr className="bg-emerald-800 text-white font-bold">
                      <td className="p-2 rounded-l-lg">Peso Líquido Comercializável</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right rounded-r-lg">{pesoFinalLiquido.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Gráfico circular (4 colunas) */}
              <div className="col-span-4 flex flex-col items-center justify-center border border-neutral-100 rounded-xl p-3 bg-neutral-50/30">
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
                      strokeDasharray={`${pctLimpo} ${100 - pctLimpo}`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3.5"
                      strokeDasharray={`${pctAgua} ${100 - pctAgua}`}
                      strokeDashoffset={`-${pctLimpo}`}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#b45309"
                      strokeWidth="3.5"
                      strokeDasharray={`${pctImpureza} ${100 - pctImpureza}`}
                      strokeDashoffset={`-${pctLimpo + pctAgua}`}
                    />
                    <text x="18" y="16.5" fontFamily="sans-serif" fontSize="6" fontWeight="800" fill="#262626" textAnchor="middle" dominantBaseline="central" transform="rotate(90 18 18)">
                      {pctLimpo.toFixed(0)}%
                    </text>
                    <text x="18" y="22" fontFamily="sans-serif" fontSize="2.5" fontWeight="700" fill="#a3a3a3" textAnchor="middle" dominantBaseline="central" transform="rotate(90 18 18)">
                      LÍQUIDO
                    </text>
                  </svg>
                </div>
                
                {/* Legendas rápidas do Gráfico no PDF */}
                <div className="mt-3 space-y-1 text-[8.5px] text-neutral-600 w-full">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Líquido: {pctLimpo.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span>Água: {pctAgua.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-700 shrink-0" />
                    <span>Impurezas: {pctImpureza.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Resumo Sacas e Valores */}
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="border border-neutral-200 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Desconto Físico de Sacas (60kg)</span>
                <div className="flex justify-between items-baseline text-xs text-neutral-600">
                  <span>Sacas Originais (Brutas):</span>
                  <span className="font-bold text-neutral-900">{sacasIniciais.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-neutral-600">
                  <span>Sacas Líquidas Finais:</span>
                  <span className="font-bold text-emerald-800">{sacasFinais.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-neutral-600 border-t pt-1.5">
                  <span>Sacas Descontadas:</span>
                  <span className="font-bold text-amber-750">-{sacasPerdidas.toFixed(1)}</span>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Projeção Financeira (R$)</span>
                <div className="flex justify-between items-baseline text-xs text-neutral-600">
                  <span>Valor Carga Bruta:</span>
                  <span>{valorTotalInicial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-neutral-600">
                  <span>Valor Carga Líquida:</span>
                  <span className="text-emerald-850 font-bold">{valorTotalLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-neutral-600 border-t pt-1.5">
                  <span>Perda Econômica Estimada:</span>
                  <span className="text-amber-700 font-bold">-{prejuizoFinanceiro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 border-neutral-200 text-[10px] text-neutral-400 text-center space-y-1 mt-auto">
            <span className="block font-bold">Talhão Digital - www.talhaodigital.com.br</span>
            <span className="block">Este laudo técnico foi emitido digitalmente e é uma representação baseada nas fórmulas agronômicas de descontos de secagem e impurezas.</span>
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
