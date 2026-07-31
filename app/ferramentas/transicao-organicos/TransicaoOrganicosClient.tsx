"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Scale, Leaf, Save } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";

interface TransicaoOrganicosClientProps {
  isPro: boolean;
  userName?: string;
}

type CropPresetType = "cafe" | "milho" | "hortalicas" | "soja" | "cana" | "laranja" | "morango" | "feijao" | "cacau" | "manual";

interface CropPresetValues {
  prodConv: number;
  precoConv: number;
  custoConv: number;
  prodTrans: number;
  precoTrans: number;
  custoTrans: number;
  prodOrg: number;
  precoOrg: number;
  custoOrg: number;
}

const PRESETS: Record<CropPresetType, { nome: string; data: CropPresetValues }> = {
  cafe: {
    nome: "Café Orgânico (Arábica)",
    data: {
      prodConv: 35,
      precoConv: 1150,
      custoConv: 18000,
      prodTrans: 22,
      precoTrans: 1150,
      custoTrans: 19500,
      prodOrg: 27,
      precoOrg: 1800,
      custoOrg: 16500,
    },
  },
  milho: {
    nome: "Milho Verde / Silagem Orgânico",
    data: {
      prodConv: 120,
      precoConv: 60,
      custoConv: 5200,
      prodTrans: 80,
      precoTrans: 60,
      custoTrans: 5800,
      prodOrg: 95,
      precoOrg: 105,
      custoOrg: 4800,
    },
  },
  hortalicas: {
    nome: "Hortaliças Certificadas (Média/ha)",
    data: {
      prodConv: 80,
      precoConv: 4000,
      custoConv: 120000,
      prodTrans: 55,
      precoTrans: 4000,
      custoTrans: 135000,
      prodOrg: 65,
      precoOrg: 7200,
      custoOrg: 115000,
    },
  },
  soja: {
    nome: "Soja Orgânica (Grãos)",
    data: {
      prodConv: 60,
      precoConv: 130,
      custoConv: 4500,
      prodTrans: 40,
      precoTrans: 130,
      custoTrans: 5200,
      prodOrg: 48,
      precoOrg: 210,
      custoOrg: 4200,
    },
  },
  cana: {
    nome: "Cana-de-Açúcar Orgânica (Açúcar/Etanol)",
    data: {
      prodConv: 85,
      precoConv: 140,
      custoConv: 7200,
      prodTrans: 60,
      precoTrans: 140,
      custoTrans: 8000,
      prodOrg: 72,
      precoOrg: 210,
      custoOrg: 6800,
    },
  },
  laranja: {
    nome: "Laranja Orgânica (Mesa/Suco - Cx 40.8kg)",
    data: {
      prodConv: 800,
      precoConv: 45,
      custoConv: 15000,
      prodTrans: 500,
      precoTrans: 45,
      custoTrans: 16500,
      prodOrg: 650,
      precoOrg: 75,
      custoOrg: 14500,
    },
  },
  morango: {
    nome: "Morango Orgânico (Bandejas/kg)",
    data: {
      prodConv: 3000,
      precoConv: 12,
      custoConv: 22000,
      prodTrans: 2000,
      precoTrans: 12,
      custoTrans: 25000,
      prodOrg: 2400,
      precoOrg: 22,
      custoOrg: 20000,
    },
  },
  feijao: {
    nome: "Feijão Orgânico (Carioca/Preto)",
    data: {
      prodConv: 35,
      precoConv: 275,
      custoConv: 6200,
      prodTrans: 22,
      precoTrans: 275,
      custoTrans: 7000,
      prodOrg: 28,
      precoOrg: 420,
      custoOrg: 5800,
    },
  },
  cacau: {
    nome: "Cacao Orgânico / Cabruca (Arroba @)",
    data: {
      prodConv: 70,
      precoConv: 280,
      custoConv: 8000,
      prodTrans: 45,
      precoTrans: 280,
      custoTrans: 9500,
      prodOrg: 55,
      precoOrg: 460,
      custoOrg: 7500,
    },
  },
  manual: {
    nome: "Inserir Dados Manualmente",
    data: {
      prodConv: 60,
      precoConv: 130,
      custoConv: 5000,
      prodTrans: 42,
      precoTrans: 130,
      custoTrans: 5500,
      prodOrg: 48,
      precoOrg: 220,
      custoOrg: 4500,
    },
  },
};

export default function TransicaoOrganicosClient({ isPro, userName }: TransicaoOrganicosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId');
  const autoDownload = searchParams.get('autoDownload');
  const initialInputsRef = useRef<any>(null);
  const [preset, setPreset] = useState<CropPresetType>("cafe");

  // Parâmetros Gerais
  const [areaHa, setAreaHa] = useState<number>(10);
  const [investimentoInicial, setInvestimentoInicial] = useState<number>(40000);
  const [anosTransicao, setAnosTransicao] = useState<number>(2); // 1, 2 ou 3 anos

  // Convencional
  const [prodConv, setProdConv] = useState<number>(PRESETS.cafe.data.prodConv);
  const [precoConv, setPrecoConv] = useState<number>(PRESETS.cafe.data.precoConv);
  const [custoConv, setCustoConv] = useState<number>(PRESETS.cafe.data.custoConv);

  // Transição
  const [prodTrans, setProdTrans] = useState<number>(PRESETS.cafe.data.prodTrans);
  const [precoTrans, setPrecoTrans] = useState<number>(PRESETS.cafe.data.precoTrans);
  const [custoTrans, setCustoTrans] = useState<number>(PRESETS.cafe.data.custoTrans);

  // Orgânico
  const [prodOrg, setProdOrg] = useState<number>(PRESETS.cafe.data.prodOrg);
  const [precoOrg, setPrecoOrg] = useState<number>(PRESETS.cafe.data.precoOrg);
  const [custoOrg, setCustoOrg] = useState<number>(PRESETS.cafe.data.custoOrg);

  // Laudo Técnico
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");
  const [propriedade, setPropriedade] = useState<string>("");
  const [nomeLaudo, setNomeLaudo] = useState<string>("");
  const [showValidationError, setShowValidationError] = useState<boolean>(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "";

  // ======================================================
  // PROCESSAMENTO DE CÁLCULO E PROJEÇÕES
  // ======================================================
  
  useEffect(() => {
    if (initialInputsRef.current && isSaved) {
      const isChanged =
        preset !== initialInputsRef.current.preset ||
        areaHa !== initialInputsRef.current.areaHa ||
        investimentoInicial !== initialInputsRef.current.investimentoInicial ||
        anosTransicao !== initialInputsRef.current.anosTransicao ||
        prodConv !== initialInputsRef.current.prodConv ||
        precoConv !== initialInputsRef.current.precoConv ||
        custoConv !== initialInputsRef.current.custoConv ||
        prodTrans !== initialInputsRef.current.prodTrans ||
        precoTrans !== initialInputsRef.current.precoTrans ||
        custoTrans !== initialInputsRef.current.custoTrans ||
        prodOrg !== initialInputsRef.current.prodOrg ||
        precoOrg !== initialInputsRef.current.precoOrg ||
        custoOrg !== initialInputsRef.current.custoOrg ||
        cliente !== initialInputsRef.current.cliente ||
        propriedade !== initialInputsRef.current.propriedade ||
        nomeLaudo !== initialInputsRef.current.nomeLaudo;

      if (isChanged) {
        setIsSaved(false);
      }
    }
  }, [
    preset, areaHa, investimentoInicial, anosTransicao,
    prodConv, precoConv, custoConv,
    prodTrans, precoTrans, custoTrans,
    prodOrg, precoOrg, custoOrg,
    cliente, propriedade, nomeLaudo
  ]);
  const lucroConvAnual = areaHa * (prodConv * precoConv - custoConv);
  
  // Projeção ano a ano (Anos 0 a 5)
  const projecaoAnos = Array.from({ length: 6 }, (_, t) => {
    if (t === 0) {
      return {
        ano: 0,
        fluxoConv: 0,
        fluxoOrg: -investimentoInicial,
        acumuladoConv: 0,
        acumuladoOrg: -investimentoInicial,
        acumuladoDiferencial: -investimentoInicial,
      };
    }

    const fluxoConv = lucroConvAnual;
    const isTransicao = t <= anosTransicao;
    const fluxoOrg = isTransicao
      ? areaHa * (prodTrans * precoTrans - custoTrans)
      : areaHa * (prodOrg * precoOrg - custoOrg);

    return {
      ano: t,
      fluxoConv,
      fluxoOrg,
      // Acumulados serão populados a seguir
      acumuladoConv: 0,
      acumuladoOrg: 0,
      acumuladoDiferencial: 0,
    };
  });

  // Popula acumulados
  let accConv = 0;
  let accOrg = -investimentoInicial;
  projecaoAnos.forEach((item, idx) => {
    if (idx === 0) return;
    accConv += item.fluxoConv;
    accOrg += item.fluxoOrg;
    item.acumuladoConv = accConv;
    item.acumuladoOrg = accOrg;
    item.acumuladoDiferencial = accOrg - accConv;
  });

  // Cálculo de Payback (em anos) do Investimento da Transição
  // Procura quando o acumuladoDiferencial deixa de ser negativo
  let paybackAnos: number | string = "Inviável";
  const lucroOrgAnual = areaHa * (prodOrg * precoOrg - custoOrg);
  const incrementalOrg = lucroOrgAnual - lucroConvAnual;

  if (incrementalOrg <= 0 && investimentoInicial > 0) {
    paybackAnos = "Inviável (Não há ganho pós-certificação)";
  } else {
    let cruzou = false;
    for (let t = 1; t <= 5; t++) {
      const prev = projecaoAnos[t - 1].acumuladoDiferencial;
      const curr = projecaoAnos[t].acumuladoDiferencial;
      
      if (prev < 0 && curr >= 0) {
        // Interpolação linear simples para fração do ano
        const frac = Math.abs(prev) / (curr - prev);
        paybackAnos = (t - 1) + frac;
        cruzou = true;
        break;
      }
    }

    if (!cruzou) {
      // Caso não tenha cruzado nos primeiros 5 anos, calcula matematicamente se o ganho é positivo
      const difTransAcumulada = projecaoAnos[anosTransicao].acumuladoDiferencial; // já inclui -investimento
      if (incrementalOrg > 0) {
        const anosNecessariosPostTrans = Math.abs(difTransAcumulada) / incrementalOrg;
        paybackAnos = anosTransicao + anosNecessariosPostTrans;
      } else {
        paybackAnos = "Inviável";
      }
    }
  }

  const ganhoAno5 = projecaoAnos[5].acumuladoDiferencial;

  // ======================================================
  // TRATAMENTO DE PRESETS
  // ======================================================
  const handlePresetChange = (key: CropPresetType) => {
    setPreset(key);
    const pData = PRESETS[key].data;
    setProdConv(pData.prodConv);
    setPrecoConv(pData.precoConv);
    setCustoConv(pData.custoConv);
    setProdTrans(pData.prodTrans);
    setPrecoTrans(pData.precoTrans);
    setCustoTrans(pData.custoTrans);
    setProdOrg(pData.prodOrg);
    setPrecoOrg(pData.precoOrg);
    setCustoOrg(pData.custoOrg);
  };

  // ======================================================
  // PDF / IMPRESSÃO / SALVAMENTO
  // ======================================================
  const saveReport = async () => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'transicao-organicos',
          area: 'financeiro',
          inputs: {
            preset,
            areaHa,
            investimentoInicial,
            anosTransicao,
            prodConv,
            precoConv,
            custoConv,
            prodTrans,
            precoTrans,
            custoTrans,
            prodOrg,
            precoOrg,
            custoOrg
          },
          results: {
            lucroConvAnual,
            projecaoAnos,
            paybackAnos,
            lucroOrgAnual,
            incrementalOrg,
            ganhoAno5
          },
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
      initialInputsRef.current = {
        preset,
        areaHa,
        investimentoInicial,
        anosTransicao,
        prodConv,
        precoConv,
        custoConv,
        prodTrans,
        precoTrans,
        custoTrans,
        prodOrg,
        precoOrg,
        custoOrg,
        cliente,
        propriedade,
        nomeLaudo
      };
      setIsSaved(true);
      router.refresh();
      alert("✅ Laudo técnico gravado no seu histórico com sucesso!");
      setTimeout(() => {
        handleGerarPdf(true);
      }, 300);
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
      pdf.save(`Transicao-Organicos-${cliente || "Laudo"}.pdf`);
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
  // GRÁFICO SVG DINÂMICO DE PROJEÇÃO DE 5 ANOS
  // ======================================================
  const renderSvgProjecao = () => {
    // Determina o valor máximo e mínimo acumulado para escala vertical
    const todosValores = projecaoAnos.flatMap(d => [d.acumuladoConv, d.acumuladoOrg]);
    const maxVal = Math.max(...todosValores, 10000);
    const minVal = Math.min(...todosValores, -10000);
    const amplitude = maxVal - minVal;

    const gW = 160; // Largura do grid do gráfico
    const gH = 70;  // Altura do grid
    const marginL = 25; // Margem esquerda
    const marginT = 15; // Margem topo

    // Converte (ano, valor) para coordenadas (X, Y) do SVG
    const getCoords = (ano: number, valor: number) => {
      const x = marginL + (ano / 5) * gW;
      const y = marginT + gH - ((valor - minVal) / amplitude) * gH;
      return { x, y };
    };

    // Gera os pontos das duas linhas
    const pontosConv = projecaoAnos.map(item => getCoords(item.ano, item.acumuladoConv));
    const pontosOrg = projecaoAnos.map(item => getCoords(item.ano, item.acumuladoOrg));

    const pathConvD = `M ${pontosConv.map(p => `${p.x} ${p.y}`).join(" L ")}`;
    const pathOrgD = `M ${pontosOrg.map(p => `${p.x} ${p.y}`).join(" L ")}`;

    // Posição Y do eixo Zero
    const zeroY = getCoords(0, 0).y;

    return (
      <svg viewBox="0 0 200 110" className="w-full mx-auto select-none font-sans">
        {/* Grid e Linha de Eixo Zero */}
        <line x1={marginL} y1={zeroY} x2={marginL + gW} y2={zeroY} stroke="#9ca3af" strokeWidth="1" strokeDasharray="2" />
        <line x1={marginL} y1={marginT} x2={marginL} y2={marginT + gH} stroke="#d1d5db" strokeWidth="1.2" />

        {/* Linha Convencional (Azul) */}
        <path d={pathConvD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Linha Orgânico (Verde) */}
        <path d={pathOrgD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

        {/* Pontos nos Anos (Finais de Ano) */}
        {pontosConv.map((p, idx) => (
          <circle key={`c-${idx}`} cx={p.x} cy={p.y} r="2.5" fill="#3b82f6" stroke="#fff" strokeWidth="0.8" />
        ))}
        {pontosOrg.map((p, idx) => (
          <circle key={`o-${idx}`} cx={p.x} cy={p.y} r="2.5" fill="#10b981" stroke="#fff" strokeWidth="0.8" />
        ))}

        {/* Legendas e Eixo X */}
        {projecaoAnos.map((item, idx) => {
          const p = getCoords(item.ano, 0);
          return (
            <text key={`l-${idx}`} x={p.x} y={marginT + gH + 11} textAnchor="middle" className="text-[6.5px] fill-neutral-500 font-bold">
              A{item.ano}
            </text>
          );
        })}

        {/* Linha vertical tracejada do Payback caso esteja nos 5 anos */}
        {typeof paybackAnos === "number" && paybackAnos <= 5 && (
          <>
            <line 
              x1={marginL + (paybackAnos / 5) * gW} 
              y1={marginT} 
              x2={marginL + (paybackAnos / 5) * gW} 
              y2={marginT + gH} 
              stroke="#f97316" 
              strokeWidth="0.8" 
              strokeDasharray="2 2" 
            />
            <circle cx={marginL + (paybackAnos / 5) * gW} cy={zeroY} r="3" fill="#f97316" />
          </>
        )}

        {/* Legendas superiores dos cenários */}
        <g transform="translate(30, 8)">
          <circle cx="0" cy="0" r="2.5" fill="#3b82f6" />
          <text x="6" y="2.5" className="text-[6px] fill-neutral-600 font-bold">Convencional</text>

          <circle cx="65" cy="0" r="2.5" fill="#10b981" />
          <text x="71" y="2.5" className="text-[6px] fill-neutral-600 font-bold">Transição/Orgânico</text>
        </g>
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
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Viabilidade de Transição para Orgânicos</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Retorno de Investimento, Payback de Transição e Prospecção Econômica de 5 Anos
                <Link href="/ajuda#transicao-organicos" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
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
                  fileName={`Transicao-Organicos-${cliente || "Laudo"}`}
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
            
            {/* Bloco 1: Parâmetros Gerais */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">1. Parâmetros da Transição</h2>
                <p className="text-xs text-neutral-500 mt-1">Defina a cultura de referência, área total e tempo da certificação regulatória</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Preset de Cultura Orgânica</label>
                  <select
                    value={preset}
                    onChange={(e) => handlePresetChange(e.target.value as CropPresetType)}
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
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Investimento Inicial Total (R$)</label>
                  <input
                    type="number"
                    value={investimentoInicial}
                    onChange={(e) => setInvestimentoInicial(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Duração da Transição (anos)</label>
                  <select
                    value={anosTransicao}
                    onChange={(e) => setAnosTransicao(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                  >
                    <option value="1">1 ano (Mínimo culturas anuais)</option>
                    <option value="2">2 anos (Recomendado culturas perenes/médias)</option>
                    <option value="3">3 anos (Transição longa)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 2: Cenários (Convencional, Transição e Orgânico) */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">2. Comparativo de Lavouras</h2>
                <p className="text-xs text-neutral-500 mt-1">Compare produtividade, preços de venda e custos operacionais</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Cabeçalho dos campos */}
                <div />
                <div className="text-center font-bold text-xs text-neutral-500 uppercase">Convencional</div>
                <div className="text-center font-bold text-xs text-neutral-500 uppercase">Orgânico</div>

                {/* Produtividade */}
                <div className="flex items-center text-xs font-bold text-neutral-700">Produtividade (sc ou @/ha)</div>
                <input
                  type="number"
                  value={prodConv}
                  onChange={(e) => { setProdConv(Number(e.target.value)); setPreset("manual"); }}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm text-center font-bold"
                />
                <input
                  type="number"
                  value={prodOrg}
                  onChange={(e) => { setProdOrg(Number(e.target.value)); setPreset("manual"); }}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm text-center font-bold text-emerald-800"
                />

                {/* Preço */}
                <div className="flex items-center text-xs font-bold text-neutral-700">Preço de Venda (R$/unid)</div>
                <input
                  type="number"
                  value={precoConv}
                  onChange={(e) => { setPrecoConv(Number(e.target.value)); setPreset("manual"); }}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm text-center font-bold"
                />
                <input
                  type="number"
                  value={precoOrg}
                  onChange={(e) => { setPrecoOrg(Number(e.target.value)); setPreset("manual"); }}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm text-center font-bold text-emerald-800"
                />

                {/* Custos */}
                <div className="flex items-center text-xs font-bold text-neutral-700">Custo Anual (R$/ha)</div>
                <input
                  type="number"
                  value={custoConv}
                  onChange={(e) => { setCustoConv(Number(e.target.value)); setPreset("manual"); }}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm text-center font-bold"
                />
                <input
                  type="number"
                  value={custoOrg}
                  onChange={(e) => { setCustoOrg(Number(e.target.value)); setPreset("manual"); }}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm text-center font-bold text-emerald-800"
                />
              </div>

              {/* Seção adicional para a Fase de Transição */}
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 mt-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-600">Configurações Específicas do Período de Transição</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">Produtividade (sc/ha)</label>
                    <input
                      type="number"
                      value={prodTrans}
                      onChange={(e) => { setProdTrans(Number(e.target.value)); setPreset("manual"); }}
                      className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">Preço Venda Transição (R$)</label>
                    <input
                      type="number"
                      value={precoTrans}
                      onChange={(e) => { setPrecoTrans(Number(e.target.value)); setPreset("manual"); }}
                      className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 uppercase mb-1">Custo Produção (R$/ha)</label>
                    <input
                      type="number"
                      value={custoTrans}
                      onChange={(e) => { setCustoTrans(Number(e.target.value)); setPreset("manual"); }}
                      className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
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
                    placeholder="Ex: Conversão Café Especial"
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
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Viabilidade de Conversão</p>
                <p className="text-2xl font-extrabold tracking-tight">
                  {typeof paybackAnos === "string" ? "⚠️ Transição Complexa" : "✓ Conversão Viável"}
                </p>
                
                <p className="text-emerald-400 text-xs mt-1">
                  Payback Estimado: <span className="font-bold text-white">
                    {typeof paybackAnos === "number" 
                      ? `${paybackAnos.toFixed(1)} anos` 
                      : paybackAnos}
                  </span>
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-emerald-900">
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Saldo Líquido Ano 5</p>
                    <p className={`text-lg font-extrabold ${ganhoAno5 >= 0 ? "text-white" : "text-rose-400"}`}>
                      {ganhoAno5 >= 0 ? "+" : ""}R$ {ganhoAno5.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Lucro Orgânico Est.</p>
                    <p className="text-lg font-extrabold text-white">
                      R$ {lucroOrgAnual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/ano
                    </p>
                  </div>
                </div>

                {/* Detalhe de volumes */}
                <div className="mt-4 pt-3 border-t border-emerald-900 text-xs text-emerald-300">
                  <p>• Lucro Convencional: **R$ {lucroConvAnual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/ano**</p>
                  <p className="mt-0.5">• Ganho incremental anual: **R$ {(lucroOrgAnual - lucroConvAnual).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/ano** (pós-selo)</p>
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
              <h3 className="font-bold text-sm text-neutral-800">Projeção de Lucro Acumulado (5 Anos)</h3>
              <div className="bg-neutral-50 rounded-xl p-2">
                {renderSvgProjecao()}
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
              <span className="text-emerald-800 font-bold block mb-1">1. Fluxos de Caixa Anuais:</span>
              • Lucro Anual Convencional = {areaHa} ha × ({prodConv} sc × R$ {precoConv} - R$ {custoConv}) = <span className="font-bold">R$ {lucroConvAnual.toLocaleString("pt-BR")}</span>
              <br />
              • Lucro Anual na Transição (Ano 1 a {anosTransicao}) = {areaHa} ha × ({prodTrans} sc × R$ {precoTrans} - R$ {custoTrans}) = <span className="font-bold">R$ {projecaoAnos[1].fluxoOrg.toLocaleString("pt-BR")}</span>
              <br />
              • Lucro Anual Orgânico Certificado (Pós-Transição) = {areaHa} ha × ({prodOrg} sc × R$ {precoOrg} - R$ {custoOrg}) = <span className="font-bold">R$ {lucroOrgAnual.toLocaleString("pt-BR")}</span>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">2. Fluxo Incremental Acumulado (Ano 0 a 5):</span>
              <table className="w-full border-collapse mt-2">
                <thead>
                  <tr className="border-b border-neutral-350">
                    <th className="text-left py-1">Ano</th>
                    <th className="text-right py-1">Fluxo Conv.</th>
                    <th className="text-right py-1">Fluxo Org.</th>
                    <th className="text-right py-1">Diferencial</th>
                    <th className="text-right py-1">Diferencial Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {projecaoAnos.map(item => (
                    <tr key={item.ano} className="border-b border-neutral-200">
                      <td className="py-1">Ano {item.ano}</td>
                      <td className="text-right py-1">R$ {item.fluxoConv.toLocaleString("pt-BR")}</td>
                      <td className="text-right py-1">R$ {item.fluxoOrg.toLocaleString("pt-BR")}</td>
                      <td className="text-right py-1">R$ {(item.fluxoOrg - item.fluxoConv).toLocaleString("pt-BR")}</td>
                      <td className="text-right py-1 font-bold">R$ {item.acumuladoDiferencial.toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">3. Cálculo de Payback:</span>
              Determina o ano em que o Diferencial Acumulado torna-se positivo.
              <br />
              {typeof paybackAnos === "number" ? (
                <>
                  Cruzou a linha de retorno no ano aproximado de <span className="font-bold text-emerald-850">{paybackAnos.toFixed(2)} anos</span>.
                </>
              ) : (
                <span className="text-rose-600 font-bold">{paybackAnos}</span>
              )}
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
              Laudo de Viabilidade Econômica de Transição Orgânica
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
                    <th className="p-2 text-left font-bold text-emerald-900 border border-emerald-200">Métrica de Projeto</th>
                    <th className="p-2 text-right font-bold text-emerald-900 border border-emerald-200">Valor / Indicador</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-neutral-200">Área Projetada</td><td className="p-2 text-right font-bold border border-neutral-200">{areaHa} ha</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Investimento Inicial de Transição</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {investimentoInicial.toLocaleString("pt-BR")}</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Duração da Transição Regulada</td><td className="p-2 text-right font-bold border border-neutral-200">{anosTransicao} anos</td></tr>
                  
                  <tr className="bg-neutral-50">
                    <td className="p-2 border border-neutral-250 font-bold">Lucro Convencional Estimado</td>
                    <td className="p-2 text-right font-bold border border-neutral-250">R$ {lucroConvAnual.toLocaleString("pt-BR")}/ano</td>
                  </tr>
                  <tr className="bg-neutral-50">
                    <td className="p-2 border border-neutral-250 font-bold">Lucro Orgânico Estabilizado</td>
                    <td className="p-2 text-right font-bold border border-neutral-250">R$ {lucroOrgAnual.toLocaleString("pt-BR")}/ano</td>
                  </tr>
                  
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Tempo de Retorno (Payback)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">
                      {typeof paybackAnos === "number" ? `${paybackAnos.toFixed(1)} anos` : paybackAnos}
                    </td>
                  </tr>
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Saldo Diferencial Acumulado (Ano 5)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">R$ {ganhoAno5.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td>
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
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Curvas de Lucro Acumulado (5 Anos)</h3>
              <div className="w-full max-w-[250px] shadow-sm border border-neutral-200 rounded-xl overflow-hidden p-2 bg-white">
                {renderSvgProjecao()}
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
