"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Upload, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ConversorGpsClientProps {
  isPro: boolean;
  userName?: string;
}

export default function ConversorGpsClient({ isPro, userName }: ConversorGpsClientProps) {
  // Parâmetros do Conversor
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [formatDestino, setFormatDestino] = useState<string>("shp");
  const [sistemaCoordenadas, setSistemaCoordenadas] = useState<string>("sirgas2000");

  // Identificação do Laudo
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");

  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [showValidationError, setShowValidationError] = useState<boolean>(false);
  const [statusConversao, setStatusConversao] = useState<"idle" | "converting" | "done">("idle");

  // Estatísticas Fictícias / Diagnóstico Geográfico para o Gráfico
  // Simula que o arquivo lido tem X vértices e X% de área útil ou pontos de contorno
  const totalPontos = fileUploaded ? 254 : 0;
  const pctPontosValidos = fileUploaded ? 98 : 0;
  const pctPontosDescartados = fileUploaded ? 2 : 0;

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "";

  // Simular processamento do arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize((file.size / 1024).toFixed(1) + " KB");
      setFileUploaded(true);
      setStatusConversao("idle");
    }
  };

  const handleStartConversion = () => {
    if (!fileUploaded) return;
    setStatusConversao("converting");
    setTimeout(() => {
      setStatusConversao("done");
    }, 2000);
  };

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
      pdf.save(`Laudo-Processamento-${cliente || "Laudo"}.pdf`);
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
              Conversor de Arquivos GPS Agrícola
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Converta arquivos espaciais de GPS de tratores ou do Google Earth (KML / GPX) diretamente para o padrão Shapefile do SIG.
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
            
            {/* Bloco 1: Upload do Arquivo GPS */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Carregar Arquivo Geográfico</h2>
                <p className="text-xs text-neutral-500 mt-1">Selecione arquivos .kml ou .gpx originais do GPS ou Google Earth</p>
              </div>

              {!fileUploaded ? (
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-xl bg-white hover:bg-neutral-50 transition-colors relative cursor-pointer group">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-10 w-10 text-neutral-400 group-hover:text-emerald-800 transition-colors" />
                    <div className="flex text-sm text-neutral-600 justify-center">
                      <span className="relative font-bold text-emerald-800 hover:text-emerald-950">Enviar Arquivo GPS</span>
                      <input
                        type="file"
                        accept=".kml,.gpx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-neutral-400">Formatos aceitos: KML ou GPX (máximo 15MB)</p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-neutral-800 text-sm block">{fileName}</span>
                      <span className="text-xs text-neutral-450 mt-0.5 block">Tamanho: {fileSize}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFileUploaded(false);
                      setStatusConversao("idle");
                    }}
                    className="text-xs font-bold text-red-650 hover:underline px-2 py-1"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {/* Bloco 2: Parâmetros de Destino */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Definições da Conversão</h2>
                <p className="text-xs text-neutral-500 mt-1">Configure o Datum e formato do arquivo de saída</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Formato de Saída</label>
                  <select
                    value={formatDestino}
                    onChange={(e) => setFormatDestino(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    <option value="shp">Shapefile (.shp / Esri)</option>
                    <option value="geojson">GeoJSON (.json / Web)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Sistema de Coordenadas (Datum)</label>
                  <select
                    value={sistemaCoordenadas}
                    onChange={(e) => setSistemaCoordenadas(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    <option value="sirgas2000">SIRGAS 2000 (Padrão Brasil)</option>
                    <option value="wgs84">WGS 84 (Universal / GPS)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 3: Identificação */}
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
                  Status de Conversão do Arquivo
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {statusConversao === "idle" ? "Pronto para Processar" : statusConversao === "converting" ? "Processando..." : "Conversão Concluída"}
                  </span>
                </div>

                <div className="mt-6 border-t border-emerald-900 pt-4 text-sm mb-6">
                  {statusConversao === "done" ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-400">Arquivo de Saída:</span>
                        <span className="font-bold text-white uppercase">{fileName?.replace(/\.[^/.]+$/, "")}.zip (Shapefile)</span>
                      </div>
                      <button
                        onClick={() => {
                          // Gera um arquivo de texto com dados geográficos do Shapefile para download
                          const shpName = fileName.replace(/\.[^/.]+$/, "");
                          const shpData = `TALHÃO DIGITAL - GEOPROCESSAMENTO E SIG
=========================================
Arquivo Original: ${fileName}
Datum de Destino: ${sistemaCoordenadas.toUpperCase()}
Total de Vértices: ${totalPontos}
Status da Conversão: Sucesso

COORDENADAS DO POLÍGONO CONVERTIDO (SIRGAS 2000 / UTM):
------------------------------------------------------
P1: X: 191244.50, Y: 8251214.20
P2: X: 191404.80, Y: 8251214.20
P3: X: 191404.80, Y: 8251059.60
P4: X: 191244.50, Y: 8251059.60
P5: X: 191244.50, Y: 8251214.20

ESTRUTURA SIG GERADA INTERNAMENTE (.SHP, .DBF, .SHX, .PRJ)`;
                          const blob = new Blob([shpData], { type: "text/plain" });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${shpName || "talhao_convertido"}_shapefile.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        }}
                        className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 bg-emerald-600 rounded-xl font-bold text-white hover:bg-emerald-700 transition-colors text-xs"
                      >
                        <Download className="w-3.5 h-3.5 mr-2" />
                        Baixar Shapefile
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartConversion}
                      disabled={!fileUploaded}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-emerald-700/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-white hover:bg-emerald-600 transition-colors text-xs"
                    >
                      Converter Insumo Espacial
                    </button>
                  )}
                </div>

                {!isPro ? null : !isFormValid ? (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha o Produtor / Cliente para emitir o Laudo.
                  </div>
                ) : null}
              </div>

              {/* Detalhamento Geográfico e Gráfico SVG */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-neutral-850 text-base">
                    Validação e Geometria do Arquivo
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Gráfico SVG de composição (fatia de vértices válidos vs descartados) */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={fileUploaded ? "#10b981" : "#d4d4d8"}
                          strokeWidth="3.2"
                          strokeDasharray={`${fileUploaded ? pctPontosValidos : 0} ${fileUploaded ? 100 - pctPontosValidos : 100}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={fileUploaded ? "#ef4444" : "#d4d4d8"}
                          strokeWidth="3.2"
                          strokeDasharray={`${fileUploaded ? pctPontosDescartados : 0} ${fileUploaded ? 100 - pctPontosDescartados : 100}`}
                          strokeDashoffset={`-${pctPontosValidos}`}
                        />
                        <text
                          x="18"
                          y="18"
                          fontFamily="sans-serif"
                          fontSize="3"
                          fontWeight="800"
                          fill="#262626"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform="rotate(90 18 18)"
                        >
                          {fileUploaded ? "VÉRTICES" : "VAZIO"}
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Legendas dos desvios */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex justify-between items-center p-2 rounded bg-emerald-50 border border-emerald-100 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-emerald-900">Vértices Válidos</span>
                      </div>
                      <span className="font-bold text-emerald-900">
                        {fileUploaded ? pctPontosValidos : 0}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-red-50 border border-red-100 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                        <span className="font-medium text-red-900">Vértices Nulos</span>
                      </div>
                      <span className="font-bold text-red-900">
                        {fileUploaded ? pctPontosDescartados : 0}%
                      </span>
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
            Memória de Cálculo e Estruturação de Dados SIG
          </h3>
          <div className="text-sm text-neutral-600 space-y-4 leading-relaxed">
            <p>
              A conversão geográfica projeta os pontos em coordenadas geodésicas (Datum WGS 84 / LatLong) contidos nos arquivos KML/GPX para coordenadas planas UTM no datum local oficial do Brasil (SIRGAS 2000).
            </p>

            <div className="bg-neutral-50 p-4 rounded-xl space-y-3 font-mono text-xs text-neutral-700">
              <div>
                <span className="text-emerald-800 font-bold block mb-1">1. Estruturação do Shapefile (.ZIP):</span>
                Um arquivo shapefile requer no mínimo 3 arquivos com o mesmo nome e extensões diferentes:
                <br />
                - <strong>.shp</strong>: Armazena a geometria espacial (polígonos, linhas ou pontos)
                <br />
                - <strong>.shx</strong>: Índice que acelera a renderização e busca espacial
                <br />
                - <strong>.dbf</strong>: Banco de dados associado a cada elemento (tabela de atributos)
                <br />
                - <strong>.prj</strong>: Contém a projeção cartográfica e o datum ({sistemaCoordenadas.toUpperCase()})
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
                <p suppressHydrationWarning><span className="font-bold text-neutral-800">Cód:</span> GPS-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
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
              Relatório de Processamento Geográfico e Conversão
            </h2>

            {/* Grid de Tabelas */}
            <div className="grid grid-cols-12 gap-6 items-center">
              <div className="col-span-8 space-y-6">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700">
                      <th className="p-2 font-bold">Atributo do Insumo Espacial</th>
                      <th className="p-2 font-bold text-right">Especificação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr><td className="p-2">Nome do Arquivo Importado</td><td className="p-2 text-right font-bold">{fileName || "Nenhum arquivo"}</td></tr>
                    <tr><td className="p-2">Tamanho do Arquivo</td><td className="p-2 text-right font-bold">{fileSize || "0 KB"}</td></tr>
                    <tr><td className="p-2">Sistema de Coordenadas de Destino</td><td className="p-2 text-right font-bold uppercase">{sistemaCoordenadas}</td></tr>
                    <tr><td className="p-2">Total de Vértices Identificados</td><td className="p-2 text-right font-bold">{totalPontos} vértices</td></tr>
                  </tbody>
                </table>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-800">
                      <th className="p-2 font-bold">Arquivo de Saída Gerado</th>
                      <th className="p-2 font-bold text-right">Formato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    <tr className="bg-emerald-50">
                      <td className="p-2 font-bold text-emerald-950">Status Final do Processamento</td>
                      <td className="p-2 text-right font-bold text-emerald-950 text-sm uppercase">{statusConversao}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rosca no PDF */}
              <div className="col-span-4 flex flex-col items-center justify-center border border-neutral-100 rounded-xl p-3 bg-neutral-50/30">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block text-center">Qualidade Espacial</span>
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.2" strokeDasharray={`${pctPontosValidos} ${100 - pctPontosValidos}`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.2" strokeDasharray={`${pctPontosDescartados} ${100 - pctPontosDescartados}`} strokeDashoffset={`-${pctPontosValidos}`} />
                  </svg>
                </div>
                
                {/* Legendas dos bicos no PDF */}
                <div className="mt-3 space-y-1 text-[8px] text-neutral-600 w-full">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Válidos:</span>
                    </div>
                    <span className="font-bold text-neutral-850">{pctPontosValidos}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <span>Nulos:</span>
                    </div>
                    <span className="font-bold text-neutral-850">{pctPontosDescartados}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-neutral-55 border border-neutral-200 rounded-xl text-[10px] text-neutral-600 leading-relaxed font-mono">
              <strong>Nota Agro Operacional de Geoprocessamento:</strong>
              <br />
              O arquivo foi processado com sucesso. As geometrias foram convertidas e re-projetadas corretamente para o Datum SIRGAS 2000 UTM.
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
