"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Scale, Sprout, Save } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";

interface SuportePastagemClientProps {
  isPro: boolean;
  userName?: string;
}

type MetodoEntrada = "direto" | "amostragem";
type PastagemPreset = "brachiaria_decumbens" | "brachiaria_marandu" | "panicum_mombaca" | "panicum_tanzania" | "capim_elefante" | "manual";
type EficienciaPreset = "continuo_baixo" | "continuo_medio" | "rotacionado_padrao" | "rotacionado_intensivo" | "manual";
type CategoriaAnimal = "touro" | "vaca_lactante" | "boi_gordo" | "vaca_seca" | "novilha" | "garrote" | "bezerro";

const PASTAGENS: Record<PastagemPreset, { nome: string; pb: string; produtividadeMsCiclo: number }> = {
  brachiaria_decumbens: { nome: "Brachiaria decumbens", pb: "7 - 9%", produtividadeMsCiclo: 2000 },
  brachiaria_marandu: { nome: "Brachiaria brizantha (Marandu)", pb: "8 - 11%", produtividadeMsCiclo: 3000 },
  panicum_mombaca: { nome: "Panicum maximum (Mombaça)", pb: "10 - 14%", produtividadeMsCiclo: 5000 },
  panicum_tanzania: { nome: "Panicum maximum (Tanzânia)", pb: "9 - 13%", produtividadeMsCiclo: 4000 },
  capim_elefante: { nome: "Capim Elefante", pb: "11 - 15%", produtividadeMsCiclo: 6000 },
  manual: { nome: "Inserção Manual / Outro", pb: "-", produtividadeMsCiclo: 3000 },
};

const EFICIENCIAS: Record<EficienciaPreset, { nome: string; pct: number }> = {
  continuo_baixo: { nome: "Pastejo Contínuo - Manejo Tradicional (35%)", pct: 35 },
  continuo_medio: { nome: "Pastejo Contínuo - Manejo Ajustado (45%)", pct: 45 },
  rotacionado_padrao: { nome: "Pastejo Rotacionado - Convencional (55%)", pct: 55 },
  rotacionado_intensivo: { nome: "Pastejo Rotacionado - Rotacionado Intensivo (70%)", pct: 70 },
  manual: { nome: "Personalizado / Inserir Manual", pct: 50 },
};

const CATEGORIAS: Record<CategoriaAnimal, { nome: string; ua: number; pesoKg: number }> = {
  touro: { nome: "Touro Adulto", ua: 1.5, pesoKg: 675 },
  vaca_lactante: { nome: "Vaca em Lactação", ua: 1.2, pesoKg: 540 },
  boi_gordo: { nome: "Boi Gordo (Terminação)", ua: 1.0, pesoKg: 450 },
  vaca_seca: { nome: "Vaca Seca / Solteira", ua: 1.0, pesoKg: 450 },
  novilha: { nome: "Novilha (1 a 2 anos)", ua: 0.7, pesoKg: 315 },
  garrote: { nome: "Garrote (1 a 2 anos)", ua: 0.8, pesoKg: 360 },
  bezerro: { nome: "Bezerro / Bezerra (Desmama)", ua: 0.4, pesoKg: 180 },
};

export default function SuportePastagemClient({ isPro, userName }: SuportePastagemClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');
  const autoDownload = searchParams.get('autoDownload');

  // Loading state para salvar
  const [loadingSave, setLoadingSave] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const initialInputsRef = useRef<any>(null);

  // Lógica e Métodos
  const [metodo, setMetodo] = useState<MetodoEntrada>("direto");
  
  // Parâmetros de Pastagem
  const [pastagemPreset, setPastagemPreset] = useState<PastagemPreset>("brachiaria_marandu");
  const [prodMsCiclo, setProdMsCiclo] = useState<number>(3000); // kg MS/ha/ciclo
  const [areaHa, setAreaHa] = useState<number>(10);
  const [diasPeriodo, setDiasPeriodo] = useState<number>(30); // Dias de permanência no piquete

  // Amostragem por Quadrado
  const [pesoFrescoG, setPesoFrescoG] = useState<number>(1200); // g/m² fresco
  const [msPlantaPct, setMsPlantaPct] = useState<number>(25); // % de matéria seca na planta fresca

  // Eficiência de pastejo
  const [eficienciaPreset, setEficienciaPreset] = useState<EficienciaPreset>("rotacionado_padrao");
  const [eficienciaPct, setEficienciaPct] = useState<number>(55); // Eficiência de utilização (%)

  // Consumo do Rebanho
  const [categoriaAnimal, setCategoriaAnimal] = useState<CategoriaAnimal>("boi_gordo");
  const [pesoVivoMedio, setPesoVivoMedio] = useState<number>(450); // Peso Vivo médio do animal (kg)
  const [consumoMsPctPv, setConsumoMsPctPv] = useState<number>(2.5); // Consumo diário de MS (% do PV)

  // Laudo Técnico
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");
  const [propriedade, setPropriedade] = useState<string>("");
  const [nomeLaudo, setNomeLaudo] = useState<string>("");
  const [profile, setProfile] = useState<{
    creaCrtq?: string;
    conselhoEstado?: string;
    logoUrl?: string;
  } | null>(null);

  const [showValidationError, setShowValidationError] = useState<boolean>(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  useEffect(() => {
    if (userName) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          setProfile(data);
          if (data.name) setResponsavel(data.name);
        })
        .catch((err) => console.error("Erro ao buscar perfil complementar:", err));
    }
  }, [userName]);

  // Carregar dados de um laudo antigo (Reabrir / Duplicar)
  useEffect(() => {
    if (reportId) {
      fetch(`/api/reports/${reportId}`)
        .then((res) => { if (!res.ok) throw new Error("Erro ao carregar"); return res.json(); })
        .then((data) => {
          if (data && data.inputs && data.clientData) {
            setMetodo(data.inputs.metodo || "direto");
            setPastagemPreset(data.inputs.pastagemPreset || "brachiaria_marandu");
            setProdMsCiclo(Number(data.inputs.prodMsCiclo || 3000));
            setAreaHa(Number(data.inputs.areaHa || 10));
            setDiasPeriodo(Number(data.inputs.diasPeriodo || 30));
            setPesoFrescoG(Number(data.inputs.pesoFrescoG || 1200));
            setMsPlantaPct(Number(data.inputs.msPlantaPct || 25));
            setEficienciaPreset(data.inputs.eficienciaPreset || "rotacionado_padrao");
            setEficienciaPct(Number(data.inputs.eficienciaPct || 55));
            setCategoriaAnimal(data.inputs.categoriaAnimal || "boi_gordo");
            setPesoVivoMedio(Number(data.inputs.pesoVivoMedio || 450));
            setConsumoMsPctPv(Number(data.inputs.consumoMsPctPv || 2.5));
            setCliente(data.clientData.cliente || "");
            setPropriedade(data.clientData.propriedade || "");
            setNomeLaudo(data.clientData.nomeLaudo || "");
            if (data.professionalData?.responsavel) setResponsavel(data.professionalData.responsavel);
            initialInputsRef.current = {
              metodo: data.inputs.metodo || "direto",
              pastagemPreset: data.inputs.pastagemPreset || "brachiaria_marandu",
              prodMsCiclo: Number(data.inputs.prodMsCiclo || 3000),
              areaHa: Number(data.inputs.areaHa || 10),
              diasPeriodo: Number(data.inputs.diasPeriodo || 30),
              pesoFrescoG: Number(data.inputs.pesoFrescoG || 1200),
              msPlantaPct: Number(data.inputs.msPlantaPct || 25),
              eficienciaPreset: data.inputs.eficienciaPreset || "rotacionado_padrao",
              eficienciaPct: Number(data.inputs.eficienciaPct || 55),
              categoriaAnimal: data.inputs.categoriaAnimal || "boi_gordo",
              pesoVivoMedio: Number(data.inputs.pesoVivoMedio || 450),
              consumoMsPctPv: Number(data.inputs.consumoMsPctPv || 2.5),
              cliente: data.clientData.cliente || "",
              propriedade: data.clientData.propriedade || "",
              nomeLaudo: data.clientData.nomeLaudo || ""
            };
            setIsSaved(true);
          }
        })
        .catch((err) => console.error("Erro ao carregar laudo do histórico:", err));
    }
  }, [reportId]);

  // Monitorar alterações para invalidar status de salvo
  useEffect(() => {
    if (initialInputsRef.current) {
      const isDifferent =
        metodo !== initialInputsRef.current.metodo ||
        pastagemPreset !== initialInputsRef.current.pastagemPreset ||
        prodMsCiclo !== initialInputsRef.current.prodMsCiclo ||
        areaHa !== initialInputsRef.current.areaHa ||
        diasPeriodo !== initialInputsRef.current.diasPeriodo ||
        pesoFrescoG !== initialInputsRef.current.pesoFrescoG ||
        msPlantaPct !== initialInputsRef.current.msPlantaPct ||
        eficienciaPreset !== initialInputsRef.current.eficienciaPreset ||
        eficienciaPct !== initialInputsRef.current.eficienciaPct ||
        categoriaAnimal !== initialInputsRef.current.categoriaAnimal ||
        pesoVivoMedio !== initialInputsRef.current.pesoVivoMedio ||
        consumoMsPctPv !== initialInputsRef.current.consumoMsPctPv ||
        cliente !== initialInputsRef.current.cliente ||
        propriedade !== initialInputsRef.current.propriedade ||
        nomeLaudo !== initialInputsRef.current.nomeLaudo;
      if (isDifferent) { setIsSaved(false); initialInputsRef.current = null; }
    } else { setIsSaved(false); }
  }, [metodo, pastagemPreset, prodMsCiclo, areaHa, diasPeriodo, pesoFrescoG, msPlantaPct, eficienciaPreset, eficienciaPct, categoriaAnimal, pesoVivoMedio, consumoMsPctPv, cliente, propriedade, nomeLaudo]);

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

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "" && propriedade.trim() !== "" && nomeLaudo.trim() !== "";

  // ======================================================
  // PROCESSAMENTO E CÁLCULO
  // ======================================================
  // Produção de MS por hectare (kg MS/ha)
  const msPorHectare = metodo === "direto" 
    ? prodMsCiclo 
    : (pesoFrescoG * (msPlantaPct / 100) * 10000) / 1000; // g/m² -> kg/ha MS

  // Forragem Consumível Total (kg MS/ha)
  const msConsumivelHa = msPorHectare * (eficienciaPct / 100);

  // Consumo diário por UA (kg MS/dia) - 1 UA = 450 kg
  const consumoUADia = 450 * (consumoMsPctPv / 100);

  // Consumo total por UA no período (kg MS)
  const consumoUAPeriodo = consumoUADia * diasPeriodo;

  // Capacidade de Suporte em UA/ha
  const lotacaoUaHa = consumoUAPeriodo > 0 ? msConsumivelHa / consumoUAPeriodo : 0;

  // Capacidade de Suporte Total do Pasto (UA total)
  const lotacaoTotalUa = lotacaoUaHa * areaHa;

  // Equivalência em Animais
  const animalUaFator = CATEGORIAS[categoriaAnimal].ua;
  const totalAnimais = animalUaFator > 0 ? lotacaoTotalUa / animalUaFator : 0;

  // Função para salvar o relatório no banco de dados
  const saveReport = async () => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'suporte-pastagem',
          area: 'pecuaria',
          inputs: { metodo, pastagemPreset, prodMsCiclo, areaHa, diasPeriodo, pesoFrescoG, msPlantaPct, eficienciaPreset, eficienciaPct, categoriaAnimal, pesoVivoMedio, consumoMsPctPv },
          results: { msPorHectare, msConsumivelHa, lotacaoUaHa, lotacaoTotalUa, totalAnimais },
          professionalData: {
            responsavel,
            creaCrtq: "",
            conselhoEstado: "",
            logoUrl: ""
          },
          clientData: { cliente, propriedade, nomeLaudo }
        })
      });
      if (!res.ok) return false;
      return true;
    } catch (err) {
      console.error("Erro ao salvar laudo no banco:", err);
      return false;
    }
  };

  const handleSaveOnly = async () => {
    if (!isFormValid) { setShowValidationError(true); return; }
    setShowValidationError(false);
    setLoadingSave(true);
    const saved = await saveReport();
    setLoadingSave(false);
    if (saved) {
      initialInputsRef.current = { metodo, pastagemPreset, prodMsCiclo, areaHa, diasPeriodo, pesoFrescoG, msPlantaPct, eficienciaPreset, eficienciaPct, categoriaAnimal, pesoVivoMedio, consumoMsPctPv, cliente, propriedade, nomeLaudo };
      setIsSaved(true);
      router.refresh();
      alert("✅ Laudo técnico gravado no seu histórico com sucesso!");
    } else {
      alert("⚠️ Não foi possível salvar o laudo na nuvem.");
    }
  };

  // ======================================================
  // GERAÇÃO DE PDF / IMPRESSÃO
  // ======================================================
  const handleImprimir = async () => {
    if (!isPro) {
      window.location.href = "/#planos";
      return;
    }
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    const saved = await saveReport();
    if (!saved) {
      const proceed = window.confirm("⚠️ Não foi possível salvar o laudo no banco de dados. Deseja abrir a tela de impressão local mesmo assim?");
      if (!proceed) return;
    }
    window.print();
  };

  const handleGerarPdf = async (skipSave = false) => {
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
      if (!skipSave) {
        const saved = await saveReport();
        if (!saved) {
          const proceed = window.confirm("⚠️ Não foi possível salvar o laudo no banco de dados. Deseja prosseguir com a geração do PDF local mesmo assim?");
          if (!proceed) return;
        }
      }
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
      const blob = pdf.output('blob');
      setPdfBlob(blob);
      pdf.save(`Suporte-Pastagem-${cliente || "Laudo"}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  // Disparo automático do PDF se autoDownload=true estiver na URL
  useEffect(() => {
    if (reportId && autoDownload === 'true' && isPro && isFormValid) {
      const timer = setTimeout(() => {
        handleGerarPdf(true).then(() => {
          router.push('/dashboard/laudos');
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [reportId, autoDownload, isPro, isFormValid]);

  // ======================================================
  // ILUSTRAÇÃO DINÂMICA DO PASTO SVG
  // ======================================================
  const renderSvgPasto = () => {
    // Escolhe a tonalidade do pasto com base no rendimento de MS
    let corPasto = "#a3e635"; // Brilhante / Médio
    if (msPorHectare < 1500) corPasto = "#facc15"; // Amarelado / Baixo
    else if (msPorHectare > 4000) corPasto = "#15803d"; // Verde escuro / Excelente

    // Quantas vacas desenhar no pasto
    let numVacas = 1;
    if (lotacaoUaHa >= 0.8 && lotacaoUaHa < 2.0) numVacas = 2;
    else if (lotacaoUaHa >= 2.0 && lotacaoUaHa < 4.0) numVacas = 3;
    else if (lotacaoUaHa >= 4.0 && lotacaoUaHa < 6.0) numVacas = 4;
    else if (lotacaoUaHa >= 6.0) numVacas = 6;

    // Coordenadas das vacas
    const posVacas = [
      { x: 50, y: 50 },
      { x: 140, y: 70 },
      { x: 90, y: 40 },
      { x: 40, y: 80 },
      { x: 100, y: 85 },
      { x: 150, y: 35 },
    ].slice(0, numVacas);

    return (
      <svg viewBox="0 0 200 120" className="w-full h-32 mx-auto rounded-xl shadow-inner transition-colors duration-500" style={{ backgroundColor: corPasto }}>
        {/* Textura do capim */}
        <g stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" fill="none">
          <path d="M20,20 L22,15 M20,20 L24,17" />
          <path d="M60,80 L62,75 M60,80 L64,77" />
          <path d="M120,30 L122,25 M120,30 L124,27" />
          <path d="M170,90 L172,85 M170,90 L174,87" />
        </g>

        {/* Cercas laterais ilustrativas */}
        <line x1="5" y1="5" x2="5" y2="115" stroke="#78350f" strokeWidth="2.5" />
        <line x1="195" y1="5" x2="195" y2="115" stroke="#78350f" strokeWidth="2.5" />
        <line x1="0" y1="30" x2="200" y2="30" stroke="#78350f" strokeWidth="0.7" strokeDasharray="3 3" />
        <line x1="0" y1="90" x2="200" y2="90" stroke="#78350f" strokeWidth="0.7" strokeDasharray="3 3" />

        {/* Desenho simplificado dos animais */}
        {posVacas.map((v, i) => (
          <g key={i} transform={`translate(${v.x}, ${v.y}) scale(0.6)`} className="transition-all duration-500">
            {/* Corpo */}
            <rect x="-16" y="-8" width="26" height="15" rx="3" fill="#ffffff" stroke="#4b5563" strokeWidth="1" />
            {/* Manchas pretas */}
            <path d="M-10,-8 C-7,-4 -5,-8 -5,-8 L-8,-8 Z" fill="#1f2937" />
            <path d="M2,-8 C4,-5 6,-5 8,-8 Z" fill="#1f2937" />
            <circle cx="-1" cy="2" r="3" fill="#1f2937" />
            {/* Pernas */}
            <line x1="-12" y1="7" x2="-12" y2="12" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-6" y1="7" x2="-6" y2="12" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4" y1="7" x2="4" y2="12" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="8" y1="7" x2="8" y2="12" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
            {/* Cabeça */}
            <rect x="10" y="-14" width="9" height="10" rx="2" fill="#ffffff" stroke="#4b5563" strokeWidth="1" />
            <circle cx="12" cy="-9" r="1.5" fill="#e11d48" /> {/* Olho */}
            {/* Orelhas */}
            <path d="M9,-14 L7,-17" stroke="#4b5563" strokeWidth="1.5" />
          </g>
        ))}

        {/* Informações no topo do SVG */}
        <rect x="50" y="5" width="100" height="16" rx="4" fill="#000000" fillOpacity="0.4" />
        <text x="100" y="16" textAnchor="middle" fill="#ffffff" className="text-[7.5px] font-bold tracking-wider uppercase">
          Lotação: {lotacaoUaHa.toFixed(2)} UA/ha
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
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Capacidade de Suporte de Pastagem</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Lotação Animal Recomendada (UA/ha) — Pecuária & Silagem
                <Link href="/ajuda#suporte-pastagem" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
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
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={() => handleGerarPdf()}
                  disabled={!isFormValid || !isSaved || gerandoPdf}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gerandoPdf ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {gerandoPdf ? "Gerando..." : "Exportar PDF"}
                </button>
                <ShareButton
                  pdfBlob={pdfBlob}
                  fileName={`Suporte-Pastagem-${cliente || "Laudo"}`}
                  nomeLaudo={nomeLaudo}
                  responsavel={responsavel}
                  disabled={!isFormValid || !pdfBlob}
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
                  Exportar PDF
                </Link>
                <Link href="/#planos" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-amber-600/50 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-amber-600/70 transition-colors">
                  <Lock className="w-4 h-4 mr-2" />
                  Compartilhar
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
            
            {/* Seletor de Método de Avaliação */}
            <div className="flex border-b border-neutral-200 bg-neutral-100 p-1.5 rounded-xl gap-1">
              {(["direto", "amostragem"] as MetodoEntrada[]).map((met) => (
                <button
                  key={met}
                  onClick={() => setMetodo(met)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                    metodo === met
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {met === "direto" ? "✏️ Inserção Direta de MS" : "📏 Método do Quadrado (1m²)"}
                </button>
              ))}
            </div>

            {/* Bloco 1: Rendimento da Pastagem */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">1. Disponibilidade de Capim</h2>
                <p className="text-xs text-neutral-500 mt-1">Defina a quantidade de biomassa vegetal disponível para o gado</p>
              </div>

              {metodo === "direto" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Tipo de Pastagem (Presets)</label>
                    <select
                      value={pastagemPreset}
                      onChange={(e) => {
                        const val = e.target.value as PastagemPreset;
                        setPastagemPreset(val);
                        if (val !== "manual") {
                          setProdMsCiclo(PASTAGENS[val].produtividadeMsCiclo);
                        }
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    >
                      {Object.entries(PASTAGENS).map(([key, p]) => (
                        <option key={key} value={key}>{p.nome} {p.pb !== "-" ? `(${p.pb} PB)` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Massa de Matéria Seca (kg MS / ha)</label>
                    <input
                      type="number"
                      value={prodMsCiclo}
                      onChange={(e) => {
                        setProdMsCiclo(Number(e.target.value));
                        setPastagemPreset("manual");
                      }}
                      min={100}
                      step={100}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Peso Fresco Cortado (g / m²)</label>
                    <input
                      type="number"
                      value={pesoFrescoG}
                      onChange={(e) => setPesoFrescoG(Number(e.target.value))}
                      min={10}
                      step={50}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Teor de Matéria Seca (% MS da Planta)</label>
                    <input
                      type="number"
                      value={msPlantaPct}
                      onChange={(e) => setMsPlantaPct(Number(e.target.value))}
                      min={5}
                      max={100}
                      step={1}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bloco 2: Parâmetros do Piquete / Padoque */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">2. Manejo e Área de Utilização</h2>
                <p className="text-xs text-neutral-500 mt-1">Configure o tamanho da pastagem e a eficiência do aproveitamento</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Área do Pasto (hectares)</label>
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
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Dias de Permanência (Ciclo)</label>
                  <input
                    type="number"
                    value={diasPeriodo}
                    onChange={(e) => setDiasPeriodo(Number(e.target.value))}
                    min={1}
                    step={1}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Eficiência de Pastejo (%)</label>
                  <select
                    value={eficienciaPreset}
                    onChange={(e) => {
                      const val = e.target.value as EficienciaPreset;
                      setEficienciaPreset(val);
                      if (val !== "manual") {
                        setEficienciaPct(EFICIENCIAS[val].pct);
                      }
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-medium"
                  >
                    {Object.entries(EFICIENCIAS).map(([key, ef]) => (
                      <option key={key} value={key}>{ef.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {eficienciaPreset === "manual" && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Eficiência de Pastejo Manual (%)</label>
                  <input
                    type="number"
                    value={eficienciaPct}
                    onChange={(e) => setEficienciaPct(Number(e.target.value))}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  />
                </div>
              )}
            </div>

            {/* Bloco 3: Demanda Nutricional Animal */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">3. Perfil de Consumo do Rebanho</h2>
                <p className="text-xs text-neutral-500 mt-1">Configure o consumo animal estimado e a categoria de destino</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Categoria Comercial do Rebanho</label>
                  <select
                    value={categoriaAnimal}
                    onChange={(e) => setCategoriaAnimal(e.target.value as CategoriaAnimal)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    {Object.entries(CATEGORIAS).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.nome} — {cat.pesoKg}kg ({cat.ua} UA)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Consumo de MS diário (% do Peso Vivo)</label>
                  <input
                    type="number"
                    value={consumoMsPctPv}
                    onChange={(e) => setConsumoMsPctPv(Number(e.target.value))}
                    min={1}
                    max={5}
                    step={0.05}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
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
                      if (e.target.value.trim() !== "" && responsavel.trim() !== "" && propriedade.trim() !== "" && nomeLaudo.trim() !== "") setShowValidationError(false);
                    }}
                    placeholder="Nome do produtor ou fazenda"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && cliente.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Propriedade / Fazenda *</label>
                  <input
                    type="text"
                    value={propriedade}
                    onChange={(e) => {
                      setPropriedade(e.target.value);
                      if (e.target.value.trim() !== "" && responsavel.trim() !== "" && cliente.trim() !== "" && nomeLaudo.trim() !== "") setShowValidationError(false);
                    }}
                    placeholder="Nome da propriedade/fazenda"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && propriedade.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Nome do Laudo *</label>
                  <input
                    type="text"
                    value={nomeLaudo}
                    onChange={(e) => {
                      setNomeLaudo(e.target.value);
                      if (e.target.value.trim() !== "" && responsavel.trim() !== "" && cliente.trim() !== "" && propriedade.trim() !== "") setShowValidationError(false);
                    }}
                    placeholder="Ex: Lotação Invernada Seca 2026"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && nomeLaudo.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
                  />
                </div>
              </div>
              {showValidationError && (
                <p className="text-[11px] font-medium text-red-600 animate-pulse mt-2">
                  ⚠️ Os campos Responsável Técnico, Produtor / Cliente, Propriedade / Fazenda e Nome do Laudo são obrigatórios.
                </p>
              )}
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
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Capacidade de Suporte</p>
                <p className="text-4xl font-extrabold tracking-tight">
                  {lotacaoUaHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-lg font-bold text-emerald-300 ml-1">UA / ha</span>
                </p>
                <p className="text-emerald-400 text-xs mt-1">
                  Pasto Total ({areaHa} ha) suporta: <span className="font-bold text-white">{lotacaoTotalUa.toFixed(1)} UA</span>
                </p>

                <div className="mt-6 pt-4 border-t border-emerald-900">
                  <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Animais Suportados no Piquete</p>
                  <p className="text-2xl font-extrabold text-white mt-1">
                    {Math.floor(totalAnimais)} <span className="text-sm text-emerald-300 font-semibold">{CATEGORIAS[categoriaAnimal].nome}s</span>
                  </p>
                  <p className="text-[10px] text-emerald-400/80 mt-1">
                    Equivalente a {animalUaFator} UA por cabeça ({CATEGORIAS[categoriaAnimal].pesoKg} kg PV)
                  </p>
                </div>

                {/* Mensagens de erro/validação */}
                {!isPro ? null : !isFormValid ? (
                  <div className="mt-4 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha todos os campos obrigatórios para emitir o Laudo.
                  </div>
                ) : null}
              </div>
            </div>

            {/* Card Detalhamento Técnico */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-4">
              <h3 className="font-bold text-sm text-neutral-800">Visualização de Pastagem</h3>
              <div className="bg-neutral-50 rounded-xl p-2">
                {renderSvgPasto()}
              </div>
              <div className="text-[11px] text-neutral-500 leading-relaxed space-y-1">
                <p>• **Rendimento total de MS**: {msPorHectare.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kg/ha.</p>
                <p>• **Consumível (Descontado perdas)**: {msConsumivelHa.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kg MS/ha.</p>
                <p>• **Demanda por UA no ciclo**: {consumoUAPeriodo.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg MS.</p>
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
            Memória de Cálculo — Capacidade de Suporte de Pastagem
          </h2>
          <div className="font-mono text-xs text-neutral-700 space-y-4 bg-neutral-50 rounded-xl p-5">
            <div>
              <span className="text-emerald-800 font-bold block mb-1">1. Rendimento de Matéria Seca (MS):</span>
              {metodo === "direto" ? (
                <>
                  Rendimento de MS por Hectare = {prodMsCiclo.toLocaleString("pt-BR")} kg MS/ha
                </>
              ) : (
                <>
                  Rendimento MS = [Peso Fresco (g/m²) × (%MS Planta / 100) × 10.000] / 1000
                  <br />
                  Rendimento MS = [{pesoFrescoG} × ({msPlantaPct} / 100) × 10]
                  <br />
                  Rendimento MS = {msPorHectare.toLocaleString("pt-BR")} kg MS/ha
                </>
              )}
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">2. Matéria Seca Efetivamente Consumível:</span>
              MS Consumível = Rendimento de MS × (Eficiência de Pastejo / 100)
              <br />
              MS Consumível = {msPorHectare.toLocaleString("pt-BR")} × ({eficienciaPct} / 100) = <span className="font-bold">{msConsumivelHa.toLocaleString("pt-BR")} kg MS/ha</span>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">3. Consumo Requerido por UA (450 kg PV):</span>
              Consumo Diário por UA = 450 × (% Peso Vivo Consumo / 100)
              <br />
              Consumo Diário por UA = 450 × ({consumoMsPctPv} / 100) = {consumoUADia.toFixed(3)} kg MS/dia
              <br />
              <br />
              Consumo no Período = Consumo Diário por UA × Dias de Permanência
              <br />
              Consumo no Período = {consumoUADia.toFixed(3)} × {diasPeriodo} = <span className="font-bold">{consumoUAPeriodo.toFixed(2)} kg MS / UA</span>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">4. Taxa de Lotação e Rebanho Suportado:</span>
              Lotação (UA/ha) = MS Consumível / Consumo no Período
              <br />
              Lotação (UA/ha) = {msConsumivelHa.toFixed(2)} / {consumoUAPeriodo.toFixed(2)} = <span className="font-bold text-emerald-800">{lotacaoUaHa.toFixed(4)} UA/ha</span>
              <br />
              <br />
              Suporte Total do Piquete = Lotação (UA/ha) × Área do Pasto (ha)
              <br />
              Suporte Total = {lotacaoUaHa.toFixed(4)} × {areaHa} = <span className="font-bold">{lotacaoTotalUa.toFixed(2)} UA</span>
              <br />
              <br />
              Número de Animais = Suporte Total / Fator Equivalência ({CATEGORIAS[categoriaAnimal].nome}: {animalUaFator} UA)
              <br />
              Número de Animais = {lotacaoTotalUa.toFixed(2)} / {animalUaFator} = <span className="font-bold text-emerald-850">{Math.floor(totalAnimais)} cabeças</span>
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
              Laudo de Lotação e Suporte de Pastagem
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
                  <tr><td className="p-2 border border-neutral-200">Rendimento de Matéria Seca</td><td className="p-2 text-right font-bold border border-neutral-200">{msPorHectare.toLocaleString("pt-BR")} kg MS/ha</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Eficiência de Pastejo</td><td className="p-2 text-right font-bold border border-neutral-200">{eficienciaPct}%</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Área Avaliada do Pasto</td><td className="p-2 text-right font-bold border border-neutral-200">{areaHa} ha</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Período de Pastejo</td><td className="p-2 text-right font-bold border border-neutral-200">{diasPeriodo} dias</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Consumo Alimentar</td><td className="p-2 text-right font-bold border border-neutral-200">{consumoMsPctPv}% do PV/dia</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Categoria Animal de Destino</td><td className="p-2 text-right font-bold border border-neutral-200">{CATEGORIAS[categoriaAnimal].nome}</td></tr>
                  
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Lotação Recomendada (UA/ha)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-800 border border-emerald-200">{lotacaoUaHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UA/ha</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Lotação Total Suportada (UA)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-800 border border-emerald-200">{lotacaoTotalUa.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} UA</td>
                  </tr>
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Cabeças de {CATEGORIAS[categoriaAnimal].nome}</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">{Math.floor(totalAnimais)} cabeças</td>
                  </tr>

                  <tr><td className="p-2 border border-neutral-200">Responsável Técnico</td><td className="p-2 text-right font-bold border border-neutral-200">{responsavel}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Produtor / Cliente</td><td className="p-2 text-right font-bold border border-neutral-200">{cliente}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Propriedade / Fazenda</td><td className="p-2 text-right font-bold border border-neutral-200">{propriedade || "Não informada"}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Nome do Laudo</td><td className="p-2 text-right font-bold border border-neutral-200">{nomeLaudo || "Não informado"}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Diagrama Visual */}
            <div className="flex flex-col items-center justify-start pt-4">
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Simulação Visual da Pastagem</h3>
              <div className="w-full max-w-[250px] shadow-sm border border-neutral-200 rounded-xl overflow-hidden">
                {renderSvgPasto()}
              </div>
              <div className="mt-4 text-center text-[10px] text-neutral-500 max-w-[200px]">
                Representação gráfica reativa do povoamento animal com base na lotação do piquete.
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
