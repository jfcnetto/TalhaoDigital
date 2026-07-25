"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Scale, TrendingUp, Save, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";

interface RendimentoCarcacaClientProps {
  isPro: boolean;
  userName?: string;
}

type ModoAbate = "simulador" | "apuracao";
type CategoriaPreset = "boi_confinamento" | "boi_pasto" | "boi_castrado" | "novilha" | "vaca" | "manual";

const PRESETS: Record<CategoriaPreset, { nome: string; rc: number }> = {
  boi_confinamento: { nome: "Boi Inteiro (Confinamento) (55% RC)", rc: 55 },
  boi_pasto: { nome: "Boi Inteiro (Pasto) (53% RC)", rc: 53 },
  boi_castrado: { nome: "Boi Castrado (54% RC)", rc: 54 },
  novilha: { nome: "Novilha (52% RC)", rc: 52 },
  vaca: { nome: "Vaca (49% RC)", rc: 49 },
  manual: { nome: "Personalizado / Inserir Manual", rc: 50 },
};

export default function RendimentoCarcacaClient({ isPro, userName }: RendimentoCarcacaClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');
  const autoDownload = searchParams.get('autoDownload');

  // Loading state para salvar
  const [loadingSave, setLoadingSave] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const initialInputsRef = useRef<any>(null);

  const [modo, setModo] = useState<ModoAbate>("simulador");
  
  // Parâmetros do Animal
  const [pvKg, setPvKg] = useState<number>(540);
  const [categoriaPreset, setCategoriaPreset] = useState<CategoriaPreset>("boi_confinamento");
  const [rcEstimado, setRcEstimado] = useState<number>(55);
  const [pcqRealKg, setPcqRealKg] = useState<number>(297);

  // Financeiro
  const [precoArroba, setPrecoArroba] = useState<number>(235);

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
            setModo(data.inputs.modo || "simulador");
            setPvKg(Number(data.inputs.pvKg || 540));
            setCategoriaPreset(data.inputs.categoriaPreset || "boi_confinamento");
            setRcEstimado(Number(data.inputs.rcEstimado || 55));
            setPcqRealKg(Number(data.inputs.pcqRealKg || 297));
            setPrecoArroba(Number(data.inputs.precoArroba || 235));
            setCliente(data.clientData.cliente || "");
            setPropriedade(data.clientData.propriedade || "");
            setNomeLaudo(data.clientData.nomeLaudo || "");
            if (data.professionalData?.responsavel) setResponsavel(data.professionalData.responsavel);
            initialInputsRef.current = {
              modo: data.inputs.modo || "simulador",
              pvKg: Number(data.inputs.pvKg || 540),
              categoriaPreset: data.inputs.categoriaPreset || "boi_confinamento",
              rcEstimado: Number(data.inputs.rcEstimado || 55),
              pcqRealKg: Number(data.inputs.pcqRealKg || 297),
              precoArroba: Number(data.inputs.precoArroba || 235),
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
        modo !== initialInputsRef.current.modo ||
        pvKg !== initialInputsRef.current.pvKg ||
        categoriaPreset !== initialInputsRef.current.categoriaPreset ||
        rcEstimado !== initialInputsRef.current.rcEstimado ||
        pcqRealKg !== initialInputsRef.current.pcqRealKg ||
        precoArroba !== initialInputsRef.current.precoArroba ||
        cliente !== initialInputsRef.current.cliente ||
        propriedade !== initialInputsRef.current.propriedade ||
        nomeLaudo !== initialInputsRef.current.nomeLaudo;
      if (isDifferent) { setIsSaved(false); initialInputsRef.current = null; }
    } else { setIsSaved(false); }
  }, [modo, pvKg, categoriaPreset, rcEstimado, pcqRealKg, precoArroba, cliente, propriedade, nomeLaudo]);

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
  // PROCESSAMENTO DE CÁLCULO
  // ======================================================
  let rcCalculado = 0;
  let pcqKg = 0;
  let erroInviavel = false;

  if (modo === "simulador") {
    rcCalculado = rcEstimado;
    pcqKg = pvKg * (rcEstimado / 100);
  } else {
    // Modo Apuração
    rcCalculado = pvKg > 0 ? (pcqRealKg / pvKg) * 100 : 0;
    pcqKg = pcqRealKg;
    if (pcqRealKg > pvKg) {
      erroInviavel = true;
    }
  }

  // Quantidade de Arrobas (@ = Carcaça kg / 15)
  const arrobas = pcqKg / 15;

  // Faturamento Total
  const faturamentoTotal = arrobas * precoArroba;

  // Preço equivalente por kg vivo (faturamento total / peso vivo)
  const precoKgVivoEquiv = pvKg > 0 ? faturamentoTotal / pvKg : 0;

  // Função para salvar o relatório no banco de dados
  const saveReport = async () => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'rendimento-carcaca',
          area: 'pecuaria',
          inputs: { modo, pvKg, categoriaPreset, rcEstimado, pcqRealKg, precoArroba },
          results: { rcCalculado, pcqKg, arrobas, faturamentoTotal, precoKgVivoEquiv },
          professionalData: {
            responsavel,
            creaCrtq: profile?.creaCrtq || "",
            conselhoEstado: profile?.conselhoEstado || "",
            logoUrl: profile?.logoUrl || ""
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
      initialInputsRef.current = { modo, pvKg, categoriaPreset, rcEstimado, pcqRealKg, precoArroba, cliente, propriedade, nomeLaudo };
      setIsSaved(true);
      router.refresh();
      alert("✅ Laudo técnico gravado no seu histórico com sucesso!");
    } else {
      alert("⚠️ Não foi possível salvar o laudo na nuvem.");
    }
  };

  // ======================================================
  // GERAÇÃO DE PDF E IMPRESSÃO
  // ======================================================
  const handleImprimir = async () => {
    if (!isPro) {
      window.location.href = "/#planos";
      return;
    }
    if (!isFormValid || erroInviavel) {
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
    if (!isFormValid || erroInviavel) {
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
      pdf.save(`Rendimento-Carcaca-${cliente || "Laudo"}.pdf`);
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
  // FLUXOGRAMA DE SLUG / ABATE SVG DINÂMICO
  // ======================================================
  const renderSvgAbate = () => {
    return (
      <svg viewBox="0 0 200 120" className="w-full h-32 mx-auto">
        {/* Caixa 1: Animal Vivo */}
        <rect x="10" y="20" width="50" height="40" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
        <text x="35" y="35" textAnchor="middle" className="text-[7.5px] font-bold fill-neutral-600">ANIMAL VIVO</text>
        <text x="35" y="50" textAnchor="middle" className="text-xs font-extrabold fill-blue-800">{pvKg} kg</text>

        {/* Seta Abate com Rendimento */}
        <path d="M68,40 L90,40 M85,35 L90,40 L85,45" stroke="#10b981" strokeWidth="1.5" fill="none" />
        <text x="79" y="32" textAnchor="middle" className="text-[7px] font-extrabold fill-emerald-700">{rcCalculado.toFixed(1)}% RC</text>

        {/* Caixa 2: Carcaça (kg) */}
        <rect x="98" y="20" width="50" height="40" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
        <text x="123" y="35" textAnchor="middle" className="text-[7.5px] font-bold fill-neutral-600">CARCAÇA</text>
        <text x="123" y="50" textAnchor="middle" className="text-xs font-extrabold fill-emerald-800">{erroInviavel ? "Inviável" : `${pcqKg.toFixed(1)} kg`}</text>

        {/* Seta Equivalência */}
        <path d="M156,40 L166,40 M161,37 L166,40 L161,43" stroke="#6b7280" strokeWidth="1" fill="none" />

        {/* Caixa 3: Arrobas */}
        <circle cx="178" cy="40" r="14" fill="#fcf7ff" stroke="#a855f7" strokeWidth="1.5" />
        <text x="178" y="38" textAnchor="middle" className="text-[7px] font-bold fill-purple-900">PESO (@)</text>
        <text x="178" y="47" textAnchor="middle" className="text-[9.5px] font-extrabold fill-purple-700">{erroInviavel ? "-" : `${arrobas.toFixed(1)} @`}</text>

        {/* Divisória inferior */}
        <line x1="10" y1="75" x2="190" y2="75" stroke="#e5e7eb" strokeWidth="1" />

        {/* Rodapé explicativo */}
        <text x="100" y="90" textAnchor="middle" className="text-[7.5px] fill-neutral-400">Fórmula de Conversão: 1 Arroba (@) = 15 kg de carcaça</text>
        <text x="100" y="102" textAnchor="middle" className="text-[8px] font-bold fill-emerald-800">
          {erroInviavel ? "Aviso: Peso Carcaça > Peso Vivo" : `Valor Estimado: R$ ${faturamentoTotal.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`}
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
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Simulador de Rendimento de Carcaça e Arroba</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Rendimento Comercial, Faturamento em Arrobas (@) e Reais (R$) — Pecuária & Silagem
                <Link href="/ajuda#rendimento-carcaca" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
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
                  disabled={!isFormValid || erroInviavel || !isSaved}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={handleGerarPdf}
                  disabled={!isFormValid || erroInviavel || !isSaved || gerandoPdf}
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
                  fileName={`Rendimento-Carcaca-${cliente || "Laudo"}`}
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
            
            {/* Seletor de Modo de Avaliação */}
            <div className="flex border-b border-neutral-200 bg-neutral-100 p-1.5 rounded-xl gap-1">
              {(["simulador", "apuracao"] as ModoAbate[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setModo(m)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                    modo === m
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {m === "simulador" ? "🔮 Simulação Pré-Abate" : "📝 Apuração Pós-Abate"}
                </button>
              ))}
            </div>

            {/* Bloco 1: Peso Vivo do Animal */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">1. Pesagem na Fazenda</h2>
                <p className="text-xs text-neutral-500 mt-1">Insira os dados do peso bruto medido antes do abate (jejum recomendado)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Peso Vivo (PV - kg)</label>
                <input
                  type="number"
                  value={pvKg}
                  onChange={(e) => setPvKg(Number(e.target.value))}
                  min={50}
                  step={5}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold"
                />
              </div>
            </div>

            {/* Bloco 2: Parâmetros da Carcaça */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">2. Avaliação de Rendimento</h2>
                <p className="text-xs text-neutral-500 mt-1">Selecione os teores de rendimento de carcaça estimados ou pesados no frigorífico</p>
              </div>

              {modo === "simulador" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Categoria Animal (Presets)</label>
                    <select
                      value={categoriaPreset}
                      onChange={(e) => {
                        const val = e.target.value as CategoriaPreset;
                        setCategoriaPreset(val);
                        if (val !== "manual") {
                          setRcEstimado(PRESETS[val].rc);
                        }
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    >
                      {Object.entries(PRESETS).map(([key, p]) => (
                        <option key={key} value={key}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Rendimento de Carcaça Estimado (%)</label>
                    <input
                      type="number"
                      value={rcEstimado}
                      onChange={(e) => {
                        setRcEstimado(Number(e.target.value));
                        setCategoriaPreset("manual");
                      }}
                      min={30}
                      max={70}
                      step={0.1}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Peso de Carcaça Quente (PCQ - kg)</label>
                  <input
                    type="number"
                    value={pcqRealKg}
                    onChange={(e) => setPcqRealKg(Number(e.target.value))}
                    min={10}
                    step={1}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white font-bold"
                  />
                  {erroInviavel && (
                    <span className="text-red-500 text-xs mt-1 block">
                      ⚠️ O peso da carcaça não pode ser maior que o peso vivo do animal.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bloco 3: Preço de Mercado */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">3. Precificação da Arroba</h2>
                <p className="text-xs text-neutral-500 mt-1">Cotação do valor da arroba no mercado local</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Valor da Arroba (R$ / @)</label>
                <input
                  type="number"
                  value={precoArroba}
                  onChange={(e) => setPrecoArroba(Number(e.target.value))}
                  min={0}
                  step={1}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
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
                    placeholder="Ex: Rendimento Abate Safra 2026"
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
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Valor do Animal</p>
                <p className="text-4xl font-extrabold tracking-tight">
                  {erroInviavel ? (
                    <span className="text-red-300">Inviável</span>
                  ) : (
                    <>
                      R$ {faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </>
                  )}
                </p>
                
                <p className="text-emerald-400 text-xs mt-1">
                  Rendimento de Carcaça: <span className="font-bold text-white">{rcCalculado.toFixed(2)}%</span>
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-emerald-900">
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Total em Arrobas</p>
                    <p className="text-xl font-extrabold text-white">
                      {erroInviavel ? "-" : `${arrobas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} @`}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Kg Vivo Equivalente</p>
                    <p className="text-xl font-extrabold text-white">
                      {erroInviavel ? "-" : `R$ ${precoKgVivoEquiv.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </p>
                  </div>
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
              <h3 className="font-bold text-sm text-neutral-800">Fluxo de Abate</h3>
              <div className="bg-neutral-50 rounded-xl p-2">
                {renderSvgAbate()}
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
            Memória de Cálculo — Rendimento de Carcaça e Faturamento
          </h2>
          <div className="font-mono text-xs text-neutral-700 space-y-4 bg-neutral-50 rounded-xl p-5">
            <div>
              <span className="text-emerald-800 font-bold block mb-1">1. Rendimento de Carcaça (RC):</span>
              Representa a proporção do peso da carcaça limpa em relação ao peso vivo do animal antes do abate.
              <br />
              <br />
              {modo === "simulador" ? (
                <>
                  Fórmula da Carcaça Quente: PCQ (kg) = Peso Vivo × (RC Estimado / 100)
                  <br />
                  PCQ = {pvKg} × ({rcEstimado} / 100) = <span className="font-bold text-emerald-800">{pcqKg.toFixed(1)} kg</span>
                </>
              ) : (
                <>
                  Fórmula do Rendimento: RC (%) = (Peso da Carcaça / Peso Vivo) × 100
                  <br />
                  RC = ({pcqRealKg} / {pvKg}) × 100 = <span className="font-bold text-emerald-800">{rcCalculado.toFixed(3)}%</span>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">2. Equivalência em Arrobas (@):</span>
              A arroba comercial de carcaça equivale a 15 kg da carcaça limpa.
              <br />
              Quantidade em @ = Peso de Carcaça (kg) / 15
              <br />
              Quantidade em @ = {pcqKg.toFixed(2)} / 15 = <span className="font-bold">{arrobas.toFixed(4)} @</span>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="text-emerald-800 font-bold block mb-1">3. Valor Faturamento e Preço do kg Vivo:</span>
              Faturamento = Quantidade em @ × Preço da Arroba
              <br />
              Faturamento = {arrobas.toFixed(4)} @ × R$ {precoArroba.toFixed(2)} = <span className="font-bold text-emerald-850">R$ {faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <br />
              <br />
              Equivalente R$ / kg Vivo = Faturamento / Peso Vivo (kg)
              <br />
              Equivalente R$ / kg Vivo = {faturamentoTotal.toFixed(2)} / {pvKg} = <span className="font-bold">R$ {precoKgVivoEquiv.toFixed(2)} / kg vivo</span>
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
              Laudo de Rendimento de Carcaça e Faturamento
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
                    <th className="p-2 text-left font-bold text-emerald-900 border border-emerald-200">Parâmetro de Rendimento</th>
                    <th className="p-2 text-right font-bold text-emerald-900 border border-emerald-200">Valor / Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="p-2 border border-neutral-200">Peso Vivo Comercial</td><td className="p-2 text-right font-bold border border-neutral-200">{pvKg} kg</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Peso da Carcaça Quente (PCQ)</td><td className="p-2 text-right font-bold border border-neutral-200">{pcqKg.toFixed(1)} kg</td></tr>
                  <tr><td className="p-2 border border-neutral-200">Preço da Arroba Praticado</td><td className="p-2 text-right font-bold border border-neutral-200">R$ {precoArroba.toFixed(2)}</td></tr>
                  
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Rendimento de Carcaça (%)</td>
                    <td className="p-2 text-right font-extrabold text-emerald-800 border border-emerald-200">{rcCalculado.toFixed(2)}%</td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="p-2 border border-emerald-200 font-bold">Quantidade Comercial em Arrobas</td>
                    <td className="p-2 text-right font-extrabold text-emerald-800 border border-emerald-200">{arrobas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} @</td>
                  </tr>
                  <tr className="bg-emerald-100">
                    <td className="p-2 border border-emerald-300 font-bold">Faturamento Estimado Brut</td>
                    <td className="p-2 text-right font-extrabold text-emerald-900 border border-emerald-300">R$ {faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-neutral-200">Preço Equivalente por kg Vivo</td>
                    <td className="p-2 text-right font-bold border border-neutral-200">R$ {precoKgVivoEquiv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / kg</td>
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
              <h3 className="font-bold text-sm text-neutral-700 mb-4">Fluxograma Vetorial de Abate</h3>
              <div className="w-full max-w-[250px] shadow-sm border border-neutral-200 rounded-xl overflow-hidden">
                {renderSvgAbate()}
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
