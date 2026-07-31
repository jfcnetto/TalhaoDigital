"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Scale, Maximize2, DollarSign, Save } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";

interface ConversorUnidadesClientProps {
  isPro: boolean;
  userName?: string;
}

type TabType = "area" | "commodity" | "preco";

// Fatores de conversão de área para m²
const AREA_TO_M2 = {
  ha: 10000,
  paulista: 24200,
  mineiro: 48400,
  baiano: 96800,
};

const AREA_LABELS = {
  ha: "Hectare (ha)",
  paulista: "Alqueire Paulista (SP)",
  mineiro: "Alqueire Mineiro/Goiano (MG/GO)",
  baiano: "Alqueire Baiano (BA)",
  m2: "Metro Quadrado (m²)",
};

const getUnidadeLabelCurto = (unidade: string) => {
  if (unidade === "ha") return "ha";
  if (unidade === "m2") return "m²";
  if (unidade === "paulista") return "Alqueire Paulista (SP)";
  if (unidade === "mineiro") return "Alqueire Mineiro/Goiano (MG/GO)";
  if (unidade === "baiano") return "Alqueire Baiano (BA)";
  return unidade;
};

// Commodities e pesos de bushel em kg
const COMMODITY_BUSHEL_KG = {
  soja: { nome: "Soja", pesoKg: 27.2155, lbs: 60 },
  milho: { nome: "Milho", pesoKg: 25.4012, lbs: 56 },
  trigo: { nome: "Trigo", pesoKg: 27.2155, lbs: 60 },
  algodao_caroco: { nome: "Algodão (Caroço)", pesoKg: 14.5149, lbs: 32 },
  cacau_grao: { nome: "Cacau", pesoKg: 13.6078, lbs: 30 },
  cafe_verde: { nome: "Café Verde", pesoKg: 27.2155, lbs: 60 },
  aveia: { nome: "Aveia", pesoKg: 14.5149, lbs: 32 },
  cevada: { nome: "Cevada", pesoKg: 21.7724, lbs: 48 },
  centeio: { nome: "Centeio", pesoKg: 25.4012, lbs: 56 },
};

export default function ConversorUnidadesClient({ isPro, userName }: ConversorUnidadesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');
  const autoDownload = searchParams.get('autoDownload');

  // Loading state para salvar
  const [loadingSave, setLoadingSave] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const initialInputsRef = useRef<any>(null);

  const [activeTab, setActiveTab] = useState<TabType>("area");

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
  const [dataCambio, setDataCambio] = useState<string>("o");

  // Estados - Área
  const [areaValor, setAreaValor] = useState<number>(10);
  const [areaDe, setAreaDe] = useState<keyof typeof AREA_TO_M2>("paulista");
  const [areaPara, setAreaPara] = useState<keyof typeof AREA_TO_M2 | "m2">("ha");

  // Estados - Commodities
  const [commValor, setCommValor] = useState<number>(100);
  const [commCultura, setCommCultura] = useState<keyof typeof COMMODITY_BUSHEL_KG>("soja");
  const [commDirecao, setCommDirecao] = useState<"b_to_kg" | "kg_to_b">("b_to_kg");

  // Estados - Preço
  const [precoValor, setPrecoValor] = useState<number>(12.50); // US$/Bushel
  const [precoCultura, setPrecoCultura] = useState<keyof typeof COMMODITY_BUSHEL_KG>("soja");
  const [precoCambio, setPrecoCambio] = useState<number>(5.50); // R$/USD

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
            setActiveTab(data.inputs.activeTab || "area");
            setAreaValor(Number(data.inputs.areaValor || 10));
            setAreaDe(data.inputs.areaDe || "paulista");
            setAreaPara(data.inputs.areaPara || "ha");
            setCommValor(Number(data.inputs.commValor || 100));
            setCommCultura(data.inputs.commCultura || "soja");
            setCommDirecao(data.inputs.commDirecao || "b_to_kg");
            setPrecoValor(Number(data.inputs.precoValor || 12.50));
            setPrecoCultura(data.inputs.precoCultura || "soja");
            setPrecoCambio(Number(data.inputs.precoCambio || 5.50));
            setCliente(data.clientData.cliente || "");
            setPropriedade(data.clientData.propriedade || "");
            setNomeLaudo(data.clientData.nomeLaudo || "");
            if (data.professionalData?.responsavel) setResponsavel(data.professionalData.responsavel);
            initialInputsRef.current = {
              activeTab: data.inputs.activeTab || "area",
              areaValor: Number(data.inputs.areaValor || 10),
              areaDe: data.inputs.areaDe || "paulista",
              areaPara: data.inputs.areaPara || "ha",
              commValor: Number(data.inputs.commValor || 100),
              commCultura: data.inputs.commCultura || "soja",
              commDirecao: data.inputs.commDirecao || "b_to_kg",
              precoValor: Number(data.inputs.precoValor || 12.50),
              precoCultura: data.inputs.precoCultura || "soja",
              precoCambio: Number(data.inputs.precoCambio || 5.50),
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
        activeTab !== initialInputsRef.current.activeTab ||
        areaValor !== initialInputsRef.current.areaValor ||
        areaDe !== initialInputsRef.current.areaDe ||
        areaPara !== initialInputsRef.current.areaPara ||
        commValor !== initialInputsRef.current.commValor ||
        commCultura !== initialInputsRef.current.commCultura ||
        commDirecao !== initialInputsRef.current.commDirecao ||
        precoValor !== initialInputsRef.current.precoValor ||
        precoCultura !== initialInputsRef.current.precoCultura ||
        precoCambio !== initialInputsRef.current.precoCambio ||
        cliente !== initialInputsRef.current.cliente ||
        propriedade !== initialInputsRef.current.propriedade ||
        nomeLaudo !== initialInputsRef.current.nomeLaudo;
      if (isDifferent) { setIsSaved(false); initialInputsRef.current = null; }
    } else { setIsSaved(false); }
  }, [activeTab, areaValor, areaDe, areaPara, commValor, commCultura, commDirecao, precoValor, precoCultura, precoCambio, cliente, propriedade, nomeLaudo]);

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

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString("pt-BR") + " às " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setDataCambio(formatted);

    const fetchCotacao = async () => {
      try {
        const response = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL");
        const data = await response.json();
        if (data && data.USDBRL && data.USDBRL.bid) {
          const valorDolar = parseFloat(data.USDBRL.bid);
          if (!isNaN(valorDolar) && valorDolar > 0) {
            setPrecoCambio(Number(valorDolar.toFixed(2)));
            if (data.USDBRL.create_date) {
              try {
                const dateParts = data.USDBRL.create_date.split(" ");
                const date = dateParts[0].split("-").reverse().join("/");
                const time = dateParts[1].substring(0, 5);
                setDataCambio(`${date} às ${time}`);
              } catch {
                // fallback
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar cotação do dólar:", error);
      }
    };
    fetchCotacao();
  }, []);

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "" && propriedade.trim() !== "" && nomeLaudo.trim() !== "";

  // ======================================================
  // CALCULO DE ÁREA
  // ======================================================
  const calcularArea = () => {
    const valorEmM2 = areaValor * AREA_TO_M2[areaDe];
    if (areaPara === "m2") {
      return valorEmM2;
    }
    return valorEmM2 / AREA_TO_M2[areaPara];
  };

  const areaResultado = calcularArea();

  // ======================================================
  // CALCULO DE COMMODITIES
  // ======================================================
  const pesoBushel = COMMODITY_BUSHEL_KG[commCultura].pesoKg;
  const commResultadoKg = commDirecao === "b_to_kg" ? commValor * pesoBushel : commValor;
  const commResultadoBushels = commDirecao === "b_to_kg" ? commValor : commValor / pesoBushel;
  const commResultadoSacas = commResultadoKg / 60;
  const commResultadoTon = commResultadoKg / 1000;

  // ======================================================
  // CALCULO DE PREÇO (PARIDADE)
  // ======================================================
  const pesoBushelPreco = COMMODITY_BUSHEL_KG[precoCultura].pesoKg;
  // 1 saca = 60kg. Quantos bushels em uma saca? 60 / pesoBushel
  const bushelsEmSaca = 60 / pesoBushelPreco;
  const precoUsdSaca = precoValor * bushelsEmSaca;
  const precoBrlSaca = precoUsdSaca * precoCambio;

  // Função para salvar o relatório no banco de dados
  const saveReport = async () => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'conversor-unidades',
          area: 'agricultura',
          inputs: { activeTab, areaValor, areaDe, areaPara, commValor, commCultura, commDirecao, precoValor, precoCultura, precoCambio },
          results: { areaResultado, commResultadoKg, commResultadoBushels, commResultadoSacas, commResultadoTon, precoUsdSaca, precoBrlSaca },
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
      initialInputsRef.current = { activeTab, areaValor, areaDe, areaPara, commValor, commCultura, commDirecao, precoValor, precoCultura, precoCambio, cliente, propriedade, nomeLaudo };
      setIsSaved(true);
      router.refresh();
      alert("✅ Laudo técnico gravado no seu histórico com sucesso!");
    } else {
      alert("⚠️ Não foi possível salvar o laudo na nuvem.");
    }
  };

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
      pdf.save(`Conversao-Unidades-${cliente || "Laudo"}.pdf`);
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
  // SVGs DINÂMICOS
  // ======================================================
  const renderSvgArea = () => {
    // Escala comparativa aproximada dos lados dos quadrados (raíz quadrada da área)
    // ha = 100m (lado), paulista = 155m, mineiro = 220m, baiano = 311m
    const sizes = { ha: 30, paulista: 46, mineiro: 66, baiano: 94 };
    const side = sizes[areaDe] || 50;

    return (
      <svg viewBox="0 0 200 120" className="w-full h-32 mx-auto">
        {/* Fundo do terreno */}
        <rect x="10" y="10" width="180" height="100" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" rx="4" />
        
        {/* Quadrado de referência Hectare (1 ha) */}
        <rect x="20" y="20" width="30" height="30" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="22" y="32" className="text-[7px] font-bold fill-neutral-500">1 ha</text>

        {/* Quadrado da área selecionada */}
        <rect
          x="70"
          y="20"
          width={side}
          height={side}
          fill="#10b981"
          fillOpacity="0.15"
          stroke="#059669"
          strokeWidth="2"
          className="transition-all duration-300"
        />
        <text x={70 + side / 2} y={20 + side / 2 + 3} textAnchor="middle" className="text-[8px] font-bold fill-emerald-800 transition-all duration-300">
          {areaDe === "ha" ? "1 ha" : areaDe === "paulista" ? "1 Alq. SP" : areaDe === "mineiro" ? "1 Alq. MG" : "1 Alq. BA"}
        </text>

        {/* Cotas */}
        <text x="100" y="112" textAnchor="middle" className="text-[8px] fill-neutral-500">
          Proporção Física comparativa de 1 unidade
        </text>
      </svg>
    );
  };

  const renderSvgCommodity = () => {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-32 mx-auto">
        {/* Cesta / Bushel */}
        <path d="M40,50 L45,90 Q65,95 85,90 L90,50 Z" fill="#b45309" fillOpacity="0.2" stroke="#b45309" strokeWidth="2" />
        <ellipse cx="65" cy="50" rx="25" ry="6" fill="#d97706" fillOpacity="0.3" stroke="#b45309" strokeWidth="1" />
        <text x="65" y="73" textAnchor="middle" className="text-[9px] font-bold fill-amber-900">1 Bushel</text>
        <text x="65" y="85" textAnchor="middle" className="text-[8px] fill-amber-700">~{pesoBushel.toFixed(1)} kg</text>

        {/* Seta indicativa */}
        <path d="M100,65 L115,65 M110,60 L115,65 L110,70" stroke="#059669" strokeWidth="2" fill="none" />

        {/* Saca de grãos */}
        <path d="M130,45 C135,40 155,40 160,45 L165,90 C165,95 125,95 125,90 Z" fill="#059669" fillOpacity="0.2" stroke="#047857" strokeWidth="2" />
        <line x1="130" y1="52" x2="160" y2="52" stroke="#047857" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="145" y="73" textAnchor="middle" className="text-[9px] font-bold fill-emerald-900">Saca Padrão</text>
        <text x="145" y="85" textAnchor="middle" className="text-[8px] fill-emerald-700">60 kg</text>
      </svg>
    );
  };

  const renderSvgPreco = () => {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-32 mx-auto">
        {/* Representação US$ / Bushel */}
        <rect x="25" y="30" width="50" height="35" rx="3" fill="#1e3a8a" fillOpacity="0.1" stroke="#1d4ed8" strokeWidth="1.5" />
        <text x="50" y="52" textAnchor="middle" className="text-sm font-extrabold fill-blue-800">US$</text>
        <text x="50" y="80" textAnchor="middle" className="text-[8px] font-bold fill-neutral-600">por Bushel</text>

        {/* Câmbio */}
        <path d="M85,48 L105,48 M100,43 L105,48 L100,53" stroke="#10b981" strokeWidth="1.5" fill="none" />
        <text x="95" y="38" textAnchor="middle" className="text-[7px] font-bold fill-emerald-700">Dólar × {(precoCambio || 0).toFixed(2)}</text>

        {/* Representação R$ / Saca */}
        <rect x="115" y="30" width="60" height="35" rx="3" fill="#064e3b" fillOpacity="0.1" stroke="#047857" strokeWidth="1.5" />
        <text x="145" y="52" textAnchor="middle" className="text-sm font-extrabold fill-emerald-800">R$</text>
        <text x="145" y="80" textAnchor="middle" className="text-[8px] font-bold fill-neutral-600">por Saca (60kg)</text>
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
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Conversor de Unidades Agrícolas Regionais</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Alqueires, Hectares, Bushels e Paridade de Comercialização
                <Link href="/ajuda#conversor-unidades" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
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
                  fileName={`Conversao-Unidades-${cliente || "Laudo"}`}
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
            
            {/* Seletor de Aba */}
            <div className="flex border-b border-neutral-200 bg-neutral-100 p-1.5 rounded-xl gap-1">
              {(["area", "commodity", "preco"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                    activeTab === tab
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {tab === "area" ? "📐 Área Rurais" : tab === "commodity" ? "🌾 Grãos / Bushels" : "💵 Paridade Cambial"}
                </button>
              ))}
            </div>

            {/* Guia: Área */}
            {activeTab === "area" && (
              <div className="space-y-4">
                <div className="border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-lg text-neutral-800">Conversão de Áreas Rurais</h2>
                  <p className="text-xs text-neutral-500 mt-1">Converta entre alqueires regionais brasileiros e hectares</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Valor a converter</label>
                    <input
                      type="number"
                      value={areaValor}
                      onChange={(e) => setAreaValor(Number(e.target.value))}
                      min={0}
                      step={0.1}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">De (Unidade de Origem)</label>
                    <select
                      value={areaDe}
                      onChange={(e) => setAreaDe(e.target.value as keyof typeof AREA_TO_M2)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    >
                      {Object.entries(AREA_LABELS).filter(([k]) => k !== "m2").map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Para (Unidade de Destino)</label>
                    <select
                      value={areaPara}
                      onChange={(e) => setAreaPara(e.target.value as keyof typeof AREA_TO_M2 | "m2")}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    >
                      {Object.entries(AREA_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Guia: Commodities */}
            {activeTab === "commodity" && (
              <div className="space-y-4">
                <div className="border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-lg text-neutral-800">Conversão de Volume de Commodities</h2>
                  <p className="text-xs text-neutral-500 mt-1">Converta bushel americano para peso comercial em kg e sacas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Sentido da Conversão</label>
                    <select
                      value={commDirecao}
                      onChange={(e) => setCommDirecao(e.target.value as "b_to_kg" | "kg_to_b")}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    >
                      <option value="b_to_kg">Bushels para Quilogramas/Sacas</option>
                      <option value="kg_to_b">Quilogramas para Bushels</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Cultura / Commodity</label>
                    <select
                      value={commCultura}
                      onChange={(e) => setCommCultura(e.target.value as keyof typeof COMMODITY_BUSHEL_KG)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    >
                      {Object.entries(COMMODITY_BUSHEL_KG).map(([key, c]) => (
                        <option key={key} value={key}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Quantidade</label>
                    <input
                      type="number"
                      value={commValor}
                      onChange={(e) => setCommValor(Number(e.target.value))}
                      min={0}
                      step={1}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Guia: Preço */}
            {activeTab === "preco" && (
              <div className="space-y-4">
                <div className="border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-lg text-neutral-800">Paridade Cambial de Preço</h2>
                  <p className="text-xs text-neutral-500 mt-1">Converta preços internacionais de bolsa (Chicago) para paridade em sacas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Preço em Bolsa (US$ / Bushel)</label>
                    <input
                      type="number"
                      value={precoValor}
                      onChange={(e) => setPrecoValor(Number(e.target.value))}
                      min={0}
                      step={0.01}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Cultura / Commodity</label>
                    <select
                      value={precoCultura}
                      onChange={(e) => setPrecoCultura(e.target.value as keyof typeof COMMODITY_BUSHEL_KG)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    >
                      {Object.entries(COMMODITY_BUSHEL_KG).map(([key, c]) => (
                        <option key={key} value={key}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Cotação do Dólar (R$ / US$)</label>
                    <input
                      type="number"
                      value={precoCambio}
                      onChange={(e) => setPrecoCambio(Number(e.target.value))}
                      min={0}
                      step={0.01}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                    {dataCambio && (
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        Cotação de: {dataCambio}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Laudo Técnico */}
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
                    placeholder="Ex: Paridade Soja Safra 2026"
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
                {activeTab === "area" && (
                  <>
                    <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Resultado de Conversão</p>
                    <p className="text-4xl font-extrabold tracking-tight">
                      {areaResultado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-lg font-bold text-emerald-300 ml-1">
                        {getUnidadeLabelCurto(areaPara)}
                      </span>
                    </p>
                    <p className="text-emerald-400 text-xs mt-1">
                      Convertendo de {AREA_LABELS[areaDe]}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-emerald-900">
                      <div>
                        <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Origem</p>
                        <p className="text-sm font-bold text-white">{areaValor} {getUnidadeLabelCurto(areaDe)}</p>
                      </div>
                      <div>
                        <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Equivalência m²</p>
                        <p className="text-sm font-bold text-white">
                          {(areaValor * AREA_TO_M2[areaDe]).toLocaleString("pt-BR")} m²
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "commodity" && (
                  <>
                    <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                      {commDirecao === "b_to_kg" ? "Peso Comercial Convertido" : "Volume Estimado"}
                    </p>
                    <p className="text-4xl font-extrabold tracking-tight">
                      {commDirecao === "b_to_kg"
                        ? `${commResultadoKg.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
                        : `${commResultadoBushels.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bu`}
                    </p>
                    <p className="text-emerald-400 text-xs mt-1">
                      Cultura: {COMMODITY_BUSHEL_KG[commCultura].nome}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-emerald-900">
                      <div>
                        <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Sacas 60kg</p>
                        <p className="text-sm font-bold text-white">
                          {commResultadoSacas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sc
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Toneladas</p>
                        <p className="text-sm font-bold text-white">
                          {commResultadoTon.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} t
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Libras (lbs)</p>
                        <p className="text-sm font-bold text-white">
                          {Math.round(commResultadoBushels * COMMODITY_BUSHEL_KG[commCultura].lbs).toLocaleString("pt-BR")} lbs
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "preco" && (
                  <>
                    <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Preço Paridade Estimado</p>
                    <p className="text-4xl font-extrabold tracking-tight">
                      R$ {precoBrlSaca.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-lg font-bold text-emerald-300 ml-1">/ saca</span>
                    </p>
                    <p className="text-emerald-400 text-xs mt-1">
                      Cultura: {COMMODITY_BUSHEL_KG[precoCultura].nome} • Câmbio: R$ {precoCambio.toFixed(2)}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-emerald-900">
                      <div>
                        <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Valor em Dólar</p>
                        <p className="text-sm font-bold text-white">
                          US$ {precoUsdSaca.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / sc
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Valor por kg</p>
                        <p className="text-sm font-bold text-white">
                          R$ {(precoBrlSaca / 60).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} / kg
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Aviso Laudo Pendente */}
                {!isPro ? null : !isFormValid ? (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha todos os campos obrigatórios para emitir o Laudo.
                  </div>
                ) : null}
              </div>
            </div>

            {/* Card Detalhamento Técnico */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-800 mb-4">Detalhamento Gráfico</h3>
              <div className="bg-neutral-50 rounded-xl p-4">
                {activeTab === "area" && renderSvgArea()}
                {activeTab === "commodity" && renderSvgCommodity()}
                {activeTab === "preco" && renderSvgPreco()}
              </div>

              {activeTab === "area" && (
                <div className="mt-4 text-xs text-neutral-500 space-y-1">
                  <p>• 1 Hectare = 10.000 m²</p>
                  <p>• 1 Alqueire Paulista (SP) = 24.200 m² (2,42 ha)</p>
                  <p>• 1 Alqueire Mineiro (MG/GO) = 48.400 m² (4,84 ha)</p>
                  <p>• 1 Alqueire Baiano (BA) = 96.800 m² (9,68 ha)</p>
                </div>
              )}

              {activeTab === "commodity" && (
                <div className="mt-4 text-xs text-neutral-500 space-y-1">
                  <p>• Fator padrão: peso específico de referência comercial.</p>
                  <p>• Soja / Trigo / Café Verde: 1 bu = 27,2155 kg (60 lbs)</p>
                  <p>• Milho / Centeio: 1 bu = 25,4012 kg (56 lbs)</p>
                  <p>• Algodão (Caroço) / Aveia: 1 bu = 14,5149 kg (32 lbs)</p>
                  <p>• Cevada: 1 bu = 21,7724 kg (48 lbs)</p>
                  <p>• Cacau: 1 bu = 13,6078 kg (30 lbs)</p>
                </div>
              )}

              {activeTab === "preco" && (
                <div className="mt-4 text-xs text-neutral-500 space-y-1">
                  <p>• Paridade sem taxas de exportação/frete rurais.</p>
                  <p>• R$/Saca = Preço Bolsa (US$/bu) × (60 / peso do bushel) × Cotação Cambial.</p>
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
            Memória de Cálculo
          </h2>
          <div className="font-mono text-xs text-neutral-700 space-y-4 bg-neutral-50 rounded-xl p-5">
            
            {activeTab === "area" && (
              <div>
                <span className="text-emerald-800 font-bold block mb-1">Cálculo de Área Rurais</span>
                <p>O cálculo é efetuado convertendo a unidade de origem para metros quadrados (m²) e posteriormente dividindo pela equivalência da unidade de destino.</p>
                <div className="pt-2 border-t border-neutral-200 mt-2">
                  Área em m² = Valor × Fator de {AREA_LABELS[areaDe]}
                  <br />
                  Área em m² = {areaValor} × {AREA_TO_M2[areaDe].toLocaleString("pt-BR")} = {(areaValor * AREA_TO_M2[areaDe]).toLocaleString("pt-BR")} m²
                  <br />
                  Resultado Final = Área em m² / Fator de {areaPara === "m2" ? "Metro Quadrado" : AREA_LABELS[areaPara]}
                  <br />
                  Resultado Final = {(areaValor * AREA_TO_M2[areaDe]).toLocaleString("pt-BR")} / {areaPara === "m2" ? 1 : AREA_TO_M2[areaPara]}
                  <br />
                  <span className="font-bold text-emerald-800">Resultado = {areaResultado.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {areaPara === "m2" ? "m²" : areaPara === "ha" ? "ha" : "Alqueires"}</span>
                </div>
              </div>
            )}

            {activeTab === "commodity" && (
              <div>
                <span className="text-emerald-800 font-bold block mb-1">Cálculo de Peso Comercial / Commodities</span>
                <p>O bushel é uma medida histórica de volume. A conversão comercial baseia-se no peso padrão em libras (lbs) de grãos de alta qualidade, regulamentada pelo USDA.</p>
                <div className="pt-2 border-t border-neutral-200 mt-2">
                  Cultura: {COMMODITY_BUSHEL_KG[commCultura].nome} • Peso do Bushel: {pesoBushel} kg ({COMMODITY_BUSHEL_KG[commCultura].lbs} lbs)
                  <br />
                  {commDirecao === "b_to_kg" ? (
                    <>
                      Fórmula: Peso (kg) = Bushels × Peso por Bushel
                      <br />
                      Peso (kg) = {commValor} × {pesoBushel} = {commResultadoKg.toLocaleString("pt-BR", { minimumFractionDigits: 4 })} kg
                    </>
                  ) : (
                    <>
                      Fórmula: Bushels = Peso (kg) / Peso por Bushel
                      <br />
                      Bushels = {commValor} / {pesoBushel} = {commResultadoBushels.toLocaleString("pt-BR", { minimumFractionDigits: 4 })} bu
                    </>
                  )}
                  <br />
                  Sacas (60kg) = Peso (kg) / 60 = {commResultadoSacas.toLocaleString("pt-BR", { minimumFractionDigits: 4 })} sacas
                  <br />
                  Toneladas = Peso (kg) / 1000 = {commResultadoTon.toLocaleString("pt-BR", { minimumFractionDigits: 4 })} t
                </div>
              </div>
            )}

            {activeTab === "preco" && (
              <div>
                <span className="text-emerald-800 font-bold block mb-1">Cálculo de Paridade cambial</span>
                <p>Converte a cotação internacional de US$ por bushel (bolsa de Chicago) para R$ por saca de 60kg, considerando o peso específico do grão.</p>
                <div className="pt-2 border-t border-neutral-200 mt-2">
                  Peso do Bushel ({COMMODITY_BUSHEL_KG[precoCultura].nome}) = {pesoBushelPreco} kg
                  <br />
                  Bushels por Saca de 60kg = 60 / {pesoBushelPreco} = {bushelsEmSaca.toFixed(4)} bushels
                  <br />
                  Preço em Dólar por Saca (US$/Saca) = US$/Bushel × Bushels por Saca
                  <br />
                  US$/Saca = {precoValor} × {bushelsEmSaca.toFixed(4)} = US$ {precoUsdSaca.toFixed(4)}
                  <br />
                  Preço em Reais por Saca (R$/Saca) = US$/Saca × Câmbio (USD/BRL)
                  <br />
                  R$/Saca = {precoUsdSaca.toFixed(4)} × {precoCambio.toFixed(2)}
                  <br />
                  <span className="font-bold text-emerald-800">Preço Estimado = R$ {precoBrlSaca.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por Saca de 60kg</span>
                </div>
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
              Laudo de Conversão de Unidades Rurais
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
                    <th className="p-2 text-left font-bold text-emerald-900 border border-emerald-200">Tipo de Parâmetro</th>
                    <th className="p-2 text-right font-bold text-emerald-900 border border-emerald-200">Valor / Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === "area" && (
                    <>
                      <tr><td className="p-2 border border-neutral-200">Tipo de Conversão</td><td className="p-2 text-right font-bold border border-neutral-200">Áreas Rurais</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Valor de Origem</td><td className="p-2 text-right font-bold border border-neutral-200">{areaValor} ({AREA_LABELS[areaDe]})</td></tr>
                      <tr className="bg-emerald-50"><td className="p-2 border border-emerald-200 font-bold">Resultado Convertido</td><td className="p-2 text-right font-extrabold text-emerald-800 border border-emerald-200">{areaResultado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({AREA_LABELS[areaPara] || "m²"})</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Equivalente em Metros Quadrados</td><td className="p-2 text-right font-bold border border-neutral-200">{(areaValor * AREA_TO_M2[areaDe]).toLocaleString("pt-BR")} m²</td></tr>
                    </>
                  )}
                  {activeTab === "commodity" && (
                    <>
                      <tr><td className="p-2 border border-neutral-200">Tipo de Conversão</td><td className="p-2 text-right font-bold border border-neutral-200">Massa de Commodities</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Cultura</td><td className="p-2 text-right font-bold border border-neutral-200">{COMMODITY_BUSHEL_KG[commCultura].nome}</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Bushels Equivalentes</td><td className="p-2 text-right font-bold border border-neutral-200">{commResultadoBushels.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} bu</td></tr>
                      <tr className="bg-emerald-50"><td className="p-2 border border-emerald-200 font-bold">Quilogramas</td><td className="p-2 text-right font-extrabold text-emerald-800 border border-emerald-200">{commResultadoKg.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Sacas de 60kg</td><td className="p-2 text-right font-bold border border-neutral-200">{commResultadoSacas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sc</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Toneladas Métricas</td><td className="p-2 text-right font-bold border border-neutral-200">{commResultadoTon.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} t</td></tr>
                    </>
                  )}
                  {activeTab === "preco" && (
                    <>
                      <tr><td className="p-2 border border-neutral-200">Tipo de Conversão</td><td className="p-2 text-right font-bold border border-neutral-200">Paridade Cambial</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Cultura</td><td className="p-2 text-right font-bold border border-neutral-200">{COMMODITY_BUSHEL_KG[precoCultura].nome}</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Cotação Cambial (BRL/USD)</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {precoCambio.toFixed(2)}</td></tr>
                      {dataCambio && (
                        <tr><td className="p-2 border border-neutral-200">Data Cotação Dólar</td><td className="p-2 text-right font-bold border border-neutral-200 text-neutral-500">{dataCambio}</td></tr>
                      )}
                      <tr><td className="p-2 border border-neutral-200">Preço em Bolsa (USD/bu)</td><td className="p-2 text-right font-bold border border-neutral-200">US$ {precoValor.toFixed(2)}</td></tr>
                      <tr><td className="p-2 border border-neutral-200">Paridade Dólar (USD/saca)</td><td className="p-2 text-right font-bold border border-neutral-200">US$ {precoUsdSaca.toFixed(2)}</td></tr>
                      <tr className="bg-emerald-50"><td className="p-2 border border-emerald-200 font-bold">Paridade Real (R$/saca)</td><td className="p-2 text-right font-extrabold text-emerald-800 border border-emerald-200">R$ {precoBrlSaca.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
                    </>
                  )}
                  <tr><td className="p-2 border border-neutral-200">Responsável Técnico</td><td className="p-2 text-right font-bold border border-neutral-200">{responsavel}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Produtor / Cliente</td><td className="p-2 text-right font-bold border border-neutral-200">{cliente}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Propriedade / Fazenda</td><td className="p-2 text-right font-bold border border-neutral-200">{propriedade || "Não informada"}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Nome do Laudo</td><td className="p-2 text-right font-bold border border-neutral-200">{nomeLaudo || "Não informado"}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Diagrama Visual */}
            <div className="flex flex-col items-center justify-start pt-4">
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Gráfico de Comparação</h3>
              <div className="w-full max-w-[260px]">
                {activeTab === "area" && renderSvgArea()}
                {activeTab === "commodity" && renderSvgCommodity()}
                {activeTab === "preco" && renderSvgPreco()}
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
