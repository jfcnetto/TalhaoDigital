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

interface DepreciacaoMaquinasClientProps {
  isPro: boolean;
  userName?: string;
}

export default function DepreciacaoMaquinasClient({ isPro, userName }: DepreciacaoMaquinasClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');
  const autoDownload = searchParams.get('autoDownload');

  // Loading state para salvar
  const [loadingSave, setLoadingSave] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const initialInputsRef = useRef<any>(null);

  // Parâmetros de Aquisição e Operação
  const [valorNovo, setValorNovo] = useState<number>(450000);
  const [vidaUtilAnos, setVidaUtilAnos] = useState<number>(10);
  const [horasUsoAno, setHorasUsoAno] = useState<number>(800);
  const [valorResidualPct, setValorResidualPct] = useState<number>(20);

  // Custos Operacionais e Manutenção
  const [combustivelHora, setCombustivelHora] = useState<number>(65);
  const [manutencaoPct, setManutencaoPct] = useState<number>(5);
  const [operadorHora, setOperadorHora] = useState<number>(25);

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
          if (data && data.inputs && data.clientData) {
            setValorNovo(Number(data.inputs.valorNovo || 450000));
            setVidaUtilAnos(Number(data.inputs.vidaUtilAnos || 10));
            setHorasUsoAno(Number(data.inputs.horasUsoAno || 800));
            setValorResidualPct(Number(data.inputs.valorResidualPct || 20));
            setCombustivelHora(Number(data.inputs.combustivelHora || 65));
            setManutencaoPct(Number(data.inputs.manutencaoPct || 5));
            setOperadorHora(Number(data.inputs.operadorHora || 25));
            setCliente(data.clientData.cliente || "");
            setPropriedade(data.clientData.propriedade || "");
            setNomeLaudo(data.clientData.nomeLaudo || "");
            if (data.professionalData?.responsavel) setResponsavel(data.professionalData.responsavel);
            initialInputsRef.current = {
              valorNovo: Number(data.inputs.valorNovo || 450000),
              vidaUtilAnos: Number(data.inputs.vidaUtilAnos || 10),
              horasUsoAno: Number(data.inputs.horasUsoAno || 800),
              valorResidualPct: Number(data.inputs.valorResidualPct || 20),
              combustivelHora: Number(data.inputs.combustivelHora || 65),
              manutencaoPct: Number(data.inputs.manutencaoPct || 5),
              operadorHora: Number(data.inputs.operadorHora || 25),
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
        valorNovo !== initialInputsRef.current.valorNovo ||
        vidaUtilAnos !== initialInputsRef.current.vidaUtilAnos ||
        horasUsoAno !== initialInputsRef.current.horasUsoAno ||
        valorResidualPct !== initialInputsRef.current.valorResidualPct ||
        combustivelHora !== initialInputsRef.current.combustivelHora ||
        manutencaoPct !== initialInputsRef.current.manutencaoPct ||
        operadorHora !== initialInputsRef.current.operadorHora ||
        cliente !== initialInputsRef.current.cliente ||
        propriedade !== initialInputsRef.current.propriedade ||
        nomeLaudo !== initialInputsRef.current.nomeLaudo;
      if (isDifferent) { setIsSaved(false); initialInputsRef.current = null; }
    } else { setIsSaved(false); }
  }, [valorNovo, vidaUtilAnos, horasUsoAno, valorResidualPct, combustivelHora, manutencaoPct, operadorHora, cliente, propriedade, nomeLaudo]);

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

  // --- Memória de Cálculo Agronômico / Gestão ---
  // 1. Valor Residual (R$):
  const valorResidual = valorNovo * (valorResidualPct / 100);

  // 2. Depreciação Anual (R$/ano) pelo método linear:
  // Depreciação = (Valor Novo - Valor Residual) / Vida Útil
  const depreciacaoAnual = (valorNovo - valorResidual) / vidaUtilAnos;

  // 3. Depreciação por Hora (R$/h):
  const depreciacaoHora = horasUsoAno > 0 ? depreciacaoAnual / horasUsoAno : 0;

  // 4. Custos Fixos Totais por Hora (R$/h) [Depreciação + Seguro/Alojamento estimados em 1% do valor novo]:
  const jurosSeguroAnual = valorNovo * 0.01;
  const custoFixoHora = depreciacaoHora + (horasUsoAno > 0 ? jurosSeguroAnual / horasUsoAno : 0);

  // 5. Custos Variáveis por Hora (R$/h) [Manutenção + Combustível + Operador]:
  const manutencaoHora = horasUsoAno > 0 ? (valorNovo * (manutencaoPct / 100)) / horasUsoAno : 0;
  const custoVariavelHora = combustivelHora + manutencaoHora + operadorHora;

  // 6. Custo Horário Total (R$/h):
  const custoHorarioTotal = custoFixoHora + custoVariavelHora;

  // Proporções para o Gráfico de Rosca SVG
  const totalCustoEx = custoHorarioTotal > 0 ? custoHorarioTotal : 1;
  const pctFixo = Math.round((custoFixoHora / totalCustoEx) * 100);
  const pctVariavel = 100 - pctFixo;

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "" && propriedade.trim() !== "" && nomeLaudo.trim() !== "";

  // Função para salvar o relatório no banco de dados
  const saveReport = async () => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'depreciacao-maquinas',
          area: 'financeiro',
          inputs: { valorNovo, vidaUtilAnos, horasUsoAno, valorResidualPct, combustivelHora, manutencaoPct, operadorHora },
          results: { valorResidual, depreciacaoAnual, depreciacaoHora, custoFixoHora, custoVariavelHora, custoHorarioTotal },
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
      initialInputsRef.current = { valorNovo, vidaUtilAnos, horasUsoAno, valorResidualPct, combustivelHora, manutencaoPct, operadorHora, cliente, propriedade, nomeLaudo };
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
      pdf.save(`Depreciacao-Custos-${cliente || "Laudo"}.pdf`);
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
              onClick={() => { router.push('/dashboard'); router.refresh(); }}
              className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao Dashboard
            </button>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Depreciação e Custo Horário de Máquinas
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Calcule os custos fixos (depreciação) e operacionais (combustível, manutenção e mão de obra) por hora de uso do maquinário agrícola.
              <Link href="/ajuda#depreciacao-maquinas" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
                (Como usar?)
              </Link>
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
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
                  className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {gerandoPdf ? "Gerando..." : "Gerar PDF"}
                </button>
                <ShareButton
                  pdfBlob={pdfBlob}
                  fileName={`Depreciacao-Custos-${cliente || "Laudo"}`}
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
            
            {/* Bloco 1: Parâmetros de Aquisição */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Aquisição & Vida Útil</h2>
                <p className="text-xs text-neutral-500 mt-1">Insira as informações de custo fixo e amortização do maquinário</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Valor do Bem Novo (R$)</label>
                  <input
                    type="number"
                    value={valorNovo || ""}
                    onChange={(e) => setValorNovo(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Vida Útil Estimada (Anos)</label>
                  <input
                    type="number"
                    value={vidaUtilAnos || ""}
                    onChange={(e) => setVidaUtilAnos(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Uso Estimado Anual (Horas/Ano)</label>
                  <input
                    type="number"
                    value={horasUsoAno || ""}
                    onChange={(e) => setHorasUsoAno(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Valor Residual (%)</label>
                  <input
                    type="number"
                    value={valorResidualPct || ""}
                    onChange={(e) => setValorResidualPct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Custos de Operação */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Variáveis Operacionais</h2>
                <p className="text-xs text-neutral-500 mt-1">Estime os custos variáveis diretos por hora de uso</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Combustível (R$/h)</label>
                  <input
                    type="number"
                    value={combustivelHora || ""}
                    onChange={(e) => setCombustivelHora(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Operador (R$/h)</label>
                  <input
                    type="number"
                    value={operadorHora || ""}
                    onChange={(e) => setOperadorHora(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Manutenção Anual (%)</label>
                  <input
                    type="number"
                    value={manutencaoPct || ""}
                    onChange={(e) => setManutencaoPct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Identificação do Laudo */}
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
                    placeholder="Ex: Depreciação Trator X 2026"
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
                  Custo Horário Total Estimado
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg text-emerald-300 font-semibold">R$</span>
                  <span className="text-4xl font-extrabold tracking-tight animate-fade-in">
                    {custoHorarioTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-lg text-emerald-300 font-semibold">/ hora</span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-emerald-900 pt-4 text-sm mb-6">
                  <div>
                    <span className="text-emerald-400 text-xs block">Depreciação Anual</span>
                    <span className="font-bold text-base mt-0.5 block text-white">
                      R$ {depreciacaoAnual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/ano
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-xs block">Custo Fixo por Hora</span>
                    <span className="font-bold text-sm mt-1.5 block text-emerald-300">
                      R$ {custoFixoHora.toFixed(2)}/h
                    </span>
                  </div>
                </div>

                {!isPro ? null : !isFormValid ? (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha todos os campos obrigatórios para emitir o Laudo.
                  </div>
                ) : null}
              </div>

              {/* Detalhamento das Fontes e Gráfico SVG */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-neutral-850 text-base">
                    Composição do Custo Horário
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Gráfico SVG de composição (rosca com divisão fixo vs variavel) */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3.2"
                          strokeDasharray={`${pctFixo} ${100 - pctFixo}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="3.2"
                          strokeDasharray={`${pctVariavel} ${100 - pctVariavel}`}
                          strokeDashoffset={`-${pctFixo}`}
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
                          CUSTO
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Legendas dos desvios */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex justify-between items-center p-2 rounded bg-blue-50 border border-blue-100 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                        <span className="font-medium text-blue-900">Custos Fixos</span>
                      </div>
                      <span className="font-bold text-blue-900">
                        {pctFixo}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded bg-yellow-50 border border-yellow-100 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                        <span className="font-medium text-yellow-900">Custos Variáveis</span>
                      </div>
                      <span className="font-bold text-yellow-900">
                        {pctVariavel}%
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
            Memória de Cálculo de Custo e Depreciação
          </h3>
          <div className="text-sm text-neutral-600 space-y-4 leading-relaxed">
            <p>
              O cálculo de depreciação linear distribui a perda de valor do maquinário ao longo de sua vida útil estimada de forma linear, fornecendo a base para o custo operacional horário (R$/h).
            </p>

            <div className="bg-neutral-50 p-4 rounded-xl space-y-3 font-mono text-xs text-neutral-700">
              <div>
                <span className="text-emerald-800 font-bold block mb-1">1. Depreciação Linear Anual:</span>
                Depreciação Anual = (Valor Novo - Valor Residual) / Vida Útil
                <br />
                Valor Residual = R$ {valorNovo} * {valorResidualPct}% = R$ {valorResidual.toLocaleString("pt-BR")}
                <br />
                Depreciação Anual = (R$ {valorNovo} - R$ {valorResidual}) / {vidaUtilAnos} = R$ {depreciacaoAnual.toLocaleString("pt-BR")}/ano
              </div>
              
              <div className="pt-3 border-t border-neutral-200">
                <span className="text-blue-800 font-bold block mb-1">2. Custo Fixo Horário (Depreciação + Juros e Seguros Estimados):</span>
                Custo Fixo por Hora = (Depreciação Anual / Horas Uso Ano) + (Seguros Anuais / Horas Uso Ano)
                <br />
                Custo Fixo por Hora = (R$ {depreciacaoAnual} / {horasUsoAno}) + (R$ {jurosSeguroAnual} / {horasUsoAno}) = R$ {custoFixoHora.toFixed(2)}/h
              </div>

              <div className="pt-3 border-t border-neutral-200">
                <span className="text-purple-800 font-bold block mb-1">3. Custo Variável Horário:</span>
                Custo Variável = Combustível + Operador + Manutenção Horária
                <br />
                Manutenção Horária = ((R$ {valorNovo} * {manutencaoPct}%) / {horasUsoAno}) = R$ {manutencaoHora.toFixed(2)}/h
                <br />
                Custo Variável = R$ {combustivelHora} (Combustível) + R$ {operadorHora} (Operador) + R$ {manutencaoHora.toFixed(2)} (Manutenção) = R$ {custoVariavelHora.toFixed(2)}/h
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
                <p suppressHydrationWarning><span className="font-bold text-neutral-800">Cód:</span> CUST-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
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
              Diagnóstico de Custo Horário e Depreciação de Máquinas
            </h2>

            {/* Grid de Tabelas */}
            <div className="grid grid-cols-12 gap-6 items-center">
              <div className="col-span-8 space-y-6">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700">
                      <th className="p-2 font-bold">Insumo / Parâmetro Informado</th>
                      <th className="p-2 font-bold text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr><td className="p-2">Valor de Aquisição Novo</td><td className="p-2 text-right font-bold">R$ {valorNovo.toLocaleString("pt-BR")}</td></tr>
                    <tr><td className="p-2">Vida Útil Estimada</td><td className="p-2 text-right font-bold">{vidaUtilAnos} anos</td></tr>
                    <tr><td className="p-2">Uso Anual Estimado</td><td className="p-2 text-right font-bold">{horasUsoAno} horas/ano</td></tr>
                    <tr><td className="p-2">Valor Residual Calculado ({valorResidualPct}%)</td><td className="p-2 text-right font-bold">R$ {valorResidual.toLocaleString("pt-BR")}</td></tr>
                  </tbody>
                </table>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-800">
                      <th className="p-2 font-bold">Métrica Financeira Estimada</th>
                      <th className="p-2 font-bold text-right">Custo por Hora (R$/h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    <tr>
                      <td className="p-2">Custos Fixos Operacionais (Depreciação + Seguros)</td>
                      <td className="p-2 text-right font-bold">R$ {custoFixoHora.toFixed(2)}/h</td>
                    </tr>
                    <tr>
                      <td className="p-2">Custos Variáveis Operacionais (Combustível + Operador + Maint.)</td>
                      <td className="p-2 text-right font-bold">R$ {custoVariavelHora.toFixed(2)}/h</td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td className="p-2 font-bold text-emerald-950">Custo Horário Total do Equipamento</td>
                      <td className="p-2 text-right font-bold text-emerald-950 text-sm">R$ {custoHorarioTotal.toFixed(2)}/h</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rosca no PDF */}
              <div className="col-span-4 flex flex-col items-center justify-center border border-neutral-100 rounded-xl p-3 bg-neutral-50/30">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block text-center">Estrutura de Custo</span>
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3.2" strokeDasharray={`${pctFixo} ${100 - pctFixo}`} strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eab308" strokeWidth="3.2" strokeDasharray={`${pctVariavel} ${100 - pctVariavel}`} strokeDashoffset={`-${pctFixo}`} />
                  </svg>
                </div>
                
                {/* Legendas dos bicos no PDF */}
                <div className="mt-3 space-y-1 text-[8px] text-neutral-600 w-full">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>Fixo:</span>
                    </div>
                    <span className="font-bold text-neutral-850">{pctFixo}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                      <span>Variável:</span>
                    </div>
                    <span className="font-bold text-neutral-850">{pctVariavel}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-neutral-55 border border-neutral-200 rounded-xl text-[10px] text-neutral-600 leading-relaxed font-mono">
              <strong>Nota Agro Operacional de Custos:</strong>
              <br />
              O custo horário estimado de R$ {custoHorarioTotal.toFixed(2)}/h representa a taxa real necessária para manter a operação, cobrir o desgaste do capital (depreciação linear) e cobrir despesas de campo diretas do trator ou implemento.
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
