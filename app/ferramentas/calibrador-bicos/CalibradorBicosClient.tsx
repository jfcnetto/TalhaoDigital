"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Save } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";

interface CalibradorBicosClientProps {
  isPro: boolean;
  userName?: string;
}

export default function CalibradorBicosClient({ isPro, userName }: CalibradorBicosClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');
  const autoDownload = searchParams.get('autoDownload');

  // Loading state para salvar
  const [loadingSave, setLoadingSave] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const initialInputsRef = useRef<any>(null);

  // Parâmetros de Pulverização
  const [vazaoDesejada, setVazaoDesejada] = useState<number>(150);
  const [espacamento, setEspacamento] = useState<number>(0.5);
  const [velocidade, setVelocidade] = useState<number>(12);

  // Vazões medidas em 3 bicos
  const [bico1, setBico1] = useState<number>(1.2);
  const [bico2, setBico2] = useState<number>(1.25);
  const [bico3, setBico3] = useState<number>(1.18);

  // Identificação do Laudo
  const [responsavel, setResponsavel] = useState<string>(userName || "");
  const [cliente, setCliente] = useState<string>("");
  const [propriedade, setPropriedade] = useState<string>("");
  const [nomeLaudo, setNomeLaudo] = useState<string>("");
  const [profile, setProfile] = useState<{
    creaCrtq?: string;
    conselhoEstado?: string;
    logoUrl?: string;
  } | null>(null);

  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [showValidationError, setShowValidationError] = useState<boolean>(false);

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
          if (data?.inputs && data?.clientData) {
            setVazaoDesejada(Number(data.inputs.vazaoDesejada || 150));
            setEspacamento(Number(data.inputs.espacamento || 0.5));
            setVelocidade(Number(data.inputs.velocidade || 12));
            setBico1(Number(data.inputs.bico1 || 0));
            setBico2(Number(data.inputs.bico2 || 0));
            setBico3(Number(data.inputs.bico3 || 0));
            setCliente(data.clientData.cliente || "");
            setPropriedade(data.clientData.propriedade || "");
            setNomeLaudo(data.clientData.nomeLaudo || "");
            if (data.professionalData?.responsavel) setResponsavel(data.professionalData.responsavel);
            initialInputsRef.current = {
              vazaoDesejada: Number(data.inputs.vazaoDesejada || 150),
              espacamento: Number(data.inputs.espacamento || 0.5),
              velocidade: Number(data.inputs.velocidade || 12),
              bico1: Number(data.inputs.bico1 || 0),
              bico2: Number(data.inputs.bico2 || 0),
              bico3: Number(data.inputs.bico3 || 0),
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
        vazaoDesejada !== initialInputsRef.current.vazaoDesejada ||
        espacamento !== initialInputsRef.current.espacamento ||
        velocidade !== initialInputsRef.current.velocidade ||
        bico1 !== initialInputsRef.current.bico1 ||
        bico2 !== initialInputsRef.current.bico2 ||
        bico3 !== initialInputsRef.current.bico3 ||
        cliente !== initialInputsRef.current.cliente ||
        propriedade !== initialInputsRef.current.propriedade ||
        nomeLaudo !== initialInputsRef.current.nomeLaudo;
      if (isDifferent) { setIsSaved(false); initialInputsRef.current = null; }
    } else { setIsSaved(false); }
  }, [vazaoDesejada, espacamento, velocidade, bico1, bico2, bico3, cliente, propriedade, nomeLaudo]);

  // Proteção Anti-PrintScreen
  useEffect(() => {
    if (isPro) return;
    const handleKeyUp = async (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        try { await navigator.clipboard?.writeText(""); } catch (err) {}
        alert("🔒 A captura de tela deste relatório é bloqueada no Plano Gratuito. Assine o Plano Pro!");
      }
    };
    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, [isPro]);

  // --- Memória de Cálculo Agronômico ---
  const vazaoCalculadaBico = (velocidade * vazaoDesejada * espacamento) / 600;
  const mediaMedida = (bico1 + bico2 + bico3) / 3;
  const desvioBico1 = ((bico1 - vazaoCalculadaBico) / vazaoCalculadaBico) * 100;
  const desvioBico2 = ((bico2 - vazaoCalculadaBico) / vazaoCalculadaBico) * 100;
  const desvioBico3 = ((bico3 - vazaoCalculadaBico) / vazaoCalculadaBico) * 100;
  const bico1Ok = Math.abs(desvioBico1) <= 10;
  const bico2Ok = Math.abs(desvioBico2) <= 10;
  const bico3Ok = Math.abs(desvioBico3) <= 10;
  const todosBicosOk = bico1Ok && bico2Ok && bico3Ok;
  const pctBico1 = Math.min(100, Math.max(0, 100 + desvioBico1));
  const pctBico2 = Math.min(100, Math.max(0, 100 + desvioBico2));
  const pctBico3 = Math.min(100, Math.max(0, 100 + desvioBico3));

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "" && propriedade.trim() !== "" && nomeLaudo.trim() !== "";

  // Função para salvar o relatório no banco de dados
  const saveReport = async () => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'calibrador-bicos',
          area: 'agricultura',
          inputs: { vazaoDesejada, espacamento, velocidade, bico1, bico2, bico3 },
          results: { vazaoCalculadaBico, mediaMedida, desvioBico1, desvioBico2, desvioBico3, todosBicosOk },
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
      initialInputsRef.current = { vazaoDesejada, espacamento, velocidade, bico1, bico2, bico3, cliente, propriedade, nomeLaudo };
      setIsSaved(true);
      router.refresh();
      alert("✅ Laudo técnico gravado no seu histórico com sucesso!");
    } else {
      alert("⚠️ Não foi possível salvar o laudo na nuvem.");
    }
  };

  const handleImprimir = async () => {
    if (!isPro) { window.location.href = "/#planos"; return; }
    if (!isFormValid) { setShowValidationError(true); return; }
    setShowValidationError(false);
    const saved = await saveReport();
    if (!saved) {
      const proceed = window.confirm("⚠️ Não foi possível salvar o laudo no banco de dados. Deseja abrir a tela de impressão local mesmo assim?");
      if (!proceed) return;
    }
    window.print();
  };

  const handleGerarPdf = async (skipSave = false) => {
    if (!isPro) { window.location.href = "/#planos"; return; }
    if (!isFormValid) { setShowValidationError(true); return; }
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
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const blob = pdf.output('blob');
      setPdfBlob(blob);
      pdf.save(`Calibracao-Bicos-${cliente || "Laudo"}.pdf`);
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
        handleGerarPdf(true).then(() => { router.push('/dashboard/laudos'); });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [reportId, autoDownload, isPro, isFormValid]);

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
            <button
              type="button"
              onClick={() => { router.push('/dashboard'); router.refresh(); }}
              className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao Dashboard
            </button>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Calibrador de Bicos de Pulverização
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Calcule a vazão teórica L/min por bico e compare com a vazão real coletada em campo.
              <Link href="/ajuda#calibrador-bicos" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
                (Como usar?)
              </Link>
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {isPro ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveOnly}
                  disabled={!isFormValid || loadingSave}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loadingSave ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={handleImprimir}
                  disabled={!isFormValid || !isSaved}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => handleGerarPdf()}
                  disabled={!isFormValid || !isSaved || gerandoPdf}
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gerandoPdf ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {gerandoPdf ? "Gerando..." : "Gerar PDF"}
                </button>
                <ShareButton
                  pdfBlob={pdfBlob}
                  fileName={`Calibracao-Bicos-${cliente || "Laudo"}`}
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
                  Gerar PDF
                </Link>
                <Link href="/#planos" className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-amber-600/50 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-amber-600/70 transition-colors">
                  <Lock className="w-4 h-4 mr-2" />
                  Compartilhar
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
            
            {/* Bloco 1: Parâmetros da Pulverização */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Parâmetros Operacionais</h2>
                <p className="text-xs text-neutral-500 mt-1">Defina as variáveis de trabalho do pulverizador</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Volume de Calda (L/ha)</label>
                  <input
                    type="number"
                    value={vazaoDesejada || ""}
                    onChange={(e) => setVazaoDesejada(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Espaçamento Bicos (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={espacamento || ""}
                    onChange={(e) => setEspacamento(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Velocidade (km/h)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={velocidade || ""}
                    onChange={(e) => setVelocidade(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Medições de Campo */}
            <div className="space-y-4 pt-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Leituras Reais no Campo (L/min)</h2>
                <p className="text-xs text-neutral-500 mt-1">Colete o volume de calda em copos coletores por 1 minuto</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Bico 1 (L/min)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bico1 || ""}
                    onChange={(e) => setBico1(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Bico 2 (L/min)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bico2 || ""}
                    onChange={(e) => setBico2(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Bico 3 (L/min)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bico3 || ""}
                    onChange={(e) => setBico3(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
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
                      if (e.target.value.trim() !== "" && responsavel.trim() !== "" && propriedade.trim() !== "" && nomeLaudo.trim() !== "") setShowValidationError(false);
                    }}
                    placeholder="Nome do produtor ou fazenda"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && cliente.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
                  />
                </div>
                <div>
                  <label htmlFor="propriedadeBicos" className="block text-xs font-bold text-neutral-700 uppercase mb-1">Propriedade / Fazenda *</label>
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
                  <label htmlFor="nomeLaudoBicos" className="block text-xs font-bold text-neutral-700 uppercase mb-1">Nome do Laudo *</label>
                  <input
                    type="text"
                    value={nomeLaudo}
                    onChange={(e) => {
                      setNomeLaudo(e.target.value);
                      if (e.target.value.trim() !== "" && responsavel.trim() !== "" && cliente.trim() !== "" && propriedade.trim() !== "") setShowValidationError(false);
                    }}
                    placeholder="Ex: Calibração Pulverizador 2026"
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

          {/* Coluna da Direita: Resultados (5 colunas) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-6 space-y-6">
              
              {/* Card Destaque Hero (Padrão SaaS) */}
              <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900 rounded-full blur-2xl opacity-40 -mr-8 -mt-8" />
                
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider block">
                  Vazão Alvo Requerida (Por Bico)
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {vazaoCalculadaBico.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-lg text-emerald-300 font-semibold">L/min</span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-emerald-900 pt-4 text-sm mb-6">
                  <div>
                    <span className="text-emerald-400 text-xs block">Média Medida</span>
                    <span className="font-bold text-lg mt-0.5 block text-white">
                      {mediaMedida.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L/min
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-xs block">Status Geral</span>
                    <span className={`font-bold text-sm mt-1.5 block ${todosBicosOk ? "text-emerald-300" : "text-amber-300"}`}>
                      {todosBicosOk ? "🟢 Conforme" : "⚠️ Revisar Bicos"}
                    </span>
                  </div>
                </div>

                {isPro && !isFormValid && (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha todos os campos obrigatórios para emitir o Laudo.
                  </div>
                )}
              </div>

              {/* Detalhamento das Fontes e Gráfico SVG */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-neutral-850 text-base">
                    Desvio dos Bicos Relativo ao Alvo
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Gráfico SVG de composição (rosca com status do desvio) */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={bico1Ok ? "#10b981" : "#ef4444"}
                          strokeWidth="3.2"
                          strokeDasharray={`${33} ${67}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={bico2Ok ? "#3b82f6" : "#ef4444"}
                          strokeWidth="3.2"
                          strokeDasharray={`${33} ${67}`}
                          strokeDashoffset="-33"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={bico3Ok ? "#eab308" : "#ef4444"}
                          strokeWidth="3.2"
                          strokeDasharray={`${34} ${66}`}
                          strokeDashoffset="-66"
                        />
                        <text
                          x="18"
                          y="18"
                          fontFamily="sans-serif"
                          fontSize="4"
                          fontWeight="800"
                          fill="#262626"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform="rotate(90 18 18)"
                        >
                          {todosBicosOk ? "OK" : "REVISAR"}
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Legendas dos desvios */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex justify-between items-center p-2 rounded bg-emerald-50 border border-emerald-100 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-emerald-900">Bico 1</span>
                      </div>
                      <span className={`font-bold ${bico1Ok ? "text-emerald-900" : "text-red-650"}`}>
                        {desvioBico1 >= 0 ? "+" : ""}{desvioBico1.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-blue-50 border border-blue-100 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                        <span className="font-medium text-blue-900">Bico 2</span>
                      </div>
                      <span className={`font-bold ${bico2Ok ? "text-blue-900" : "text-red-650"}`}>
                        {desvioBico2 >= 0 ? "+" : ""}{desvioBico2.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-yellow-50 border border-yellow-100 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                        <span className="font-medium text-yellow-900">Bico 3</span>
                      </div>
                      <span className={`font-bold ${bico3Ok ? "text-yellow-900" : "text-red-650"}`}>
                        {desvioBico3 >= 0 ? "+" : ""}{desvioBico3.toFixed(1)}%
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
            Memória de Cálculo Agronômico
          </h3>
          <div className="text-sm text-neutral-600 space-y-4 leading-relaxed">
            <p>
              A vazão teórica requerida por bico para garantir a dosagem uniforme de defensivos agrícolas ou fertilizantes líquidos por hectare baseia-se na velocidade do trator e no espaçamento entre os bicos da barra de pulverização.
            </p>

            <div className="bg-neutral-50 p-4 rounded-xl space-y-3 font-mono text-xs text-neutral-700">
              <div>
                <span className="text-emerald-800 font-bold block mb-1">1. Fórmula da Vazão Alvo por Bico (L/min):</span>
                Q = (V * Q_calda * d) / 600
                <br />
                Onde:
                <br />
                - V (Velocidade) = {velocidade} km/h
                <br />
                - Q_calda (Volume) = {vazaoDesejada} L/ha
                <br />
                - d (Espaçamento) = {espacamento} m
                <br />
                Q = ({velocidade} * {vazaoDesejada} * {espacamento}) / 600 = {vazaoCalculadaBico.toFixed(3)} L/min
              </div>
              
              <div className="pt-3 border-t border-neutral-200">
                <span className="text-blue-800 font-bold block mb-1">2. Percentual de Desvio Aceitável:</span>
                Tolerância de mercado é de ±10% em relação ao alvo de {vazaoCalculadaBico.toFixed(2)} L/min.
                <br />
                - Desvio Bico 1: (({bico1.toFixed(2)} - {vazaoCalculadaBico.toFixed(2)}) / {vazaoCalculadaBico.toFixed(2)}) * 100 = {desvioBico1.toFixed(1)}% ({bico1Ok ? "Conforme" : "Incorreto"})
                <br />
                - Desvio Bico 2: (({bico2.toFixed(2)} - {vazaoCalculadaBico.toFixed(2)}) / {vazaoCalculadaBico.toFixed(2)}) * 100 = {desvioBico2.toFixed(1)}% ({bico2Ok ? "Conforme" : "Incorreto"})
                <br />
                - Desvio Bico 3: (({bico3.toFixed(2)} - {vazaoCalculadaBico.toFixed(2)}) / {vazaoCalculadaBico.toFixed(2)}) * 100 = {desvioBico3.toFixed(1)}% ({bico3Ok ? "Conforme" : "Incorreto"})
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
                <p suppressHydrationWarning><span className="font-bold text-neutral-800">Cód:</span> CAL-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
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
              <div>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Propriedade / Fazenda</p>
                <p className="font-bold text-neutral-800 text-sm uppercase">{propriedade || "Não informada"}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Nome do Laudo</p>
                <p className="font-bold text-neutral-800 text-sm uppercase">{nomeLaudo || "Não informado"}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-neutral-800 border-b pb-2 mb-6">
              Diagnóstico de Calibração de Bicos
            </h2>

            {/* Grid de Tabelas */}
            <div className="grid grid-cols-12 gap-6 items-center">
              <div className="col-span-8 space-y-6">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700">
                      <th className="p-2 font-bold">Parâmetro Operacional</th>
                      <th className="p-2 font-bold text-right">Valor Definido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr><td className="p-2">Volume de Calda Requerido</td><td className="p-2 text-right font-bold">{vazaoDesejada} L/ha</td></tr>
                    <tr><td className="p-2">Espaçamento entre Bicos</td><td className="p-2 text-right font-bold">{espacamento} m</td></tr>
                    <tr><td className="p-2">Velocidade de Pulverização</td><td className="p-2 text-right font-bold">{velocidade} km/h</td></tr>
                    <tr className="bg-emerald-50"><td className="p-2 font-bold text-emerald-950">Vazão Alvo Estimada</td><td className="p-2 text-right font-bold text-emerald-950 text-sm">{vazaoCalculadaBico.toFixed(2)} L/min</td></tr>
                  </tbody>
                </table>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-800">
                      <th className="p-2 font-bold">Bicos Coletados</th>
                      <th className="p-2 font-bold text-right">Vazão (L/min)</th>
                      <th className="p-2 font-bold text-right">Desvio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    <tr>
                      <td className="p-2">Bico Coletor 1</td>
                      <td className="p-2 text-right font-bold">{bico1.toFixed(2)} L/min</td>
                      <td className={`p-2 text-right font-bold ${bico1Ok ? "text-emerald-800" : "text-red-750"}`}>{desvioBico1.toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="p-2">Bico Coletor 2</td>
                      <td className="p-2 text-right font-bold">{bico2.toFixed(2)} L/min</td>
                      <td className={`p-2 text-right font-bold ${bico2Ok ? "text-emerald-800" : "text-red-750"}`}>{desvioBico2.toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="p-2">Bico Coletor 3</td>
                      <td className="p-2 text-right font-bold">{bico3.toFixed(2)} L/min</td>
                      <td className={`p-2 text-right font-bold ${bico3Ok ? "text-emerald-800" : "text-red-750"}`}>{desvioBico3.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rosca no PDF */}
              <div className="col-span-4 flex flex-col items-center justify-center border border-neutral-100 rounded-xl p-3 bg-neutral-50/30">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block text-center">Diagnóstico Geral</span>
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke={bico1Ok ? "#10b981" : "#ef4444"} strokeWidth="3.2" strokeDasharray="33 67" strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke={bico2Ok ? "#3b82f6" : "#ef4444"} strokeWidth="3.2" strokeDasharray="33 67" strokeDashoffset="-33" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke={bico3Ok ? "#eab308" : "#ef4444"} strokeWidth="3.2" strokeDasharray="34 66" strokeDashoffset="-66" />
                    <text
                      x="18"
                      y="18"
                      fontFamily="sans-serif"
                      fontSize="4"
                      fontWeight="800"
                      fill="#262626"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform="rotate(90 18 18)"
                    >
                      {todosBicosOk ? "OK" : "REVISAR"}
                    </text>
                  </svg>
                </div>
                
                {/* Legendas dos bicos no PDF */}
                <div className="mt-3 space-y-1 text-[8px] text-neutral-600 w-full">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Bico 1 (Desvio):</span>
                    </div>
                    <span className={`font-bold ${bico1Ok ? "text-emerald-800" : "text-red-750"}`}>{desvioBico1 >= 0 ? "+" : ""}{desvioBico1.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>Bico 2 (Desvio):</span>
                    </div>
                    <span className={`font-bold ${bico2Ok ? "text-blue-800" : "text-red-750"}`}>{desvioBico2 >= 0 ? "+" : ""}{desvioBico2.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                      <span>Bico 3 (Desvio):</span>
                    </div>
                    <span className={`font-bold ${bico3Ok ? "text-yellow-750" : "text-red-750"}`}>{desvioBico3 >= 0 ? "+" : ""}{desvioBico3.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-neutral-55 border border-neutral-200 rounded-xl text-[10px] text-neutral-600 leading-relaxed font-mono">
              <strong>Nota Agronômica de Inspeção:</strong>
              <br />
              {todosBicosOk ? (
                "Todos os bicos avaliados encontram-se dentro da margem de tolerância aceitável de ±10% em relação à vazão teórica calculada. O equipamento está calibrado e pronto para aplicação uniforme no campo."
              ) : (
                "Atenção: Um ou mais bicos coletores apresentam desvio acima do limite operacional recomendado de ±10%. Recomenda-se realizar a limpeza dos bicos ou providenciar a substituição imediata das pontas desgastadas para evitar subdosagem ou desperdício de defensivos."
              )}
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
