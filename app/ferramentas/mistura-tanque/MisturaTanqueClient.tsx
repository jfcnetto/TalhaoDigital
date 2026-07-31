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

interface MisturaTanqueClientProps {
  isPro: boolean;
  userName?: string;
}

// Tipagem de defensivos/componentes da calda
interface DefensivoItem {
  id: string;
  name: string;
  category: "adjuvante" | "po" | "liquido" | "fertilizante" | "antiespumante";
  formulaType: string;
  orderWeight: number; // Peso na ordem de adição (menor valor entra primeiro)
  dangerLevel: "low" | "medium" | "high"; // Risco de fitotoxidez ou decantação
  description: string;
}

// Catálogo de defensivos comuns para escolha do usuário
const CATALOG_DEFENSIVOS: DefensivoItem[] = [
  { id: "antiespumante", name: "Redutor de Espuma (Antiespumante)", category: "antiespumante", formulaType: "Adjuvante", orderWeight: 1, dangerLevel: "low", description: "Evita formação excessiva de ar e espuma no abastecimento do tanque." },
  { id: "adjuvante_oleo", name: "Óleo Mineral ou Vegetal", category: "adjuvante", formulaType: "Adjuvante", orderWeight: 2, dangerLevel: "medium", description: "Melhora a absorção e espalhamento das gotas nas folhas." },
  { id: "po_wp", name: "Inseticida ou Fungicida WP (Pó Molhável)", category: "po", formulaType: "WP / WG", orderWeight: 3, dangerLevel: "high", description: "Formulações em pó seco que devem ser hidratadas primeiro." },
  { id: "po_wg", name: "Herbicida WG (Grânulos Dispersíveis em Água)", category: "po", formulaType: "WG", orderWeight: 4, dangerLevel: "high", description: "Grânulos solúveis, necessitam de agitação vigorosa inicial." },
  { id: "suspensao_sc", name: "Inseticida SC (Suspensão Concentrada)", category: "liquido", formulaType: "SC / CS", orderWeight: 5, dangerLevel: "medium", description: "Ingrediente ativo sólido suspenso em meio líquido." },
  { id: "concentrado_ec", name: "Fungicida EC (Concentrado Emulsionável)", category: "liquido", formulaType: "EC", orderWeight: 6, dangerLevel: "high", description: "Contém solventes orgânicos que formam emulsão com a água." },
  { id: "soluvel_sl", name: "Herbicida SL (Concentrado Solúvel)", category: "liquido", formulaType: "SL", orderWeight: 7, dangerLevel: "low", description: "Solução homogênea cristalina que se mistura facilmente." },
  { id: "fertilizante_foliar", name: "Foliar (Micronutrientes Quelatados)", category: "fertilizante", formulaType: "Fertilizante", orderWeight: 8, dangerLevel: "high", description: "Nutrientes concentrados contendo sais minerais." },
];

export default function MisturaTanqueClient({ isPro, userName }: MisturaTanqueClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');
  const autoDownload = searchParams.get('autoDownload');

  // Loading state para salvar
  const [loadingSave, setLoadingSave] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const initialInputsRef = useRef<any>(null);

  // Estado para armazenar quais IDs de produtos estão selecionados para o tanque
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
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
            setSelectedIds(data.inputs.selectedIds || []);
            setCliente(data.clientData.cliente || "");
            setPropriedade(data.clientData.propriedade || "");
            setNomeLaudo(data.clientData.nomeLaudo || "");
            if (data.professionalData?.responsavel) setResponsavel(data.professionalData.responsavel);
            initialInputsRef.current = {
              selectedIds: data.inputs.selectedIds || [],
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
        JSON.stringify(selectedIds) !== JSON.stringify(initialInputsRef.current.selectedIds) ||
        cliente !== initialInputsRef.current.cliente ||
        propriedade !== initialInputsRef.current.propriedade ||
        nomeLaudo !== initialInputsRef.current.nomeLaudo;
      if (isDifferent) { setIsSaved(false); initialInputsRef.current = null; }
    } else { setIsSaved(false); }
  }, [selectedIds, cliente, propriedade, nomeLaudo]);

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

  // Manipular seleção
  const handleToggleProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtrar e ordenar produtos selecionados com base no orderWeight
  const activeProducts = CATALOG_DEFENSIVOS.filter((p) => selectedIds.includes(p.id))
    .sort((a, b) => a.orderWeight - b.orderWeight);

  // Determinar risco geral da mistura
  // Se houver mais de 3 itens ou combinação de Pó (WP/WG) com Concentrado Emulsionável (EC) ou Fertilizante Foliar
  const temPo = activeProducts.some((p) => p.category === "po");
  const temEC = activeProducts.some((p) => p.id === "concentrado_ec");
  const temFertilizante = activeProducts.some((p) => p.category === "fertilizante");
  
  let riskLevel: "low" | "medium" | "high" = "low";
  let statusText = "🟢 Mistura Segura";
  let statusDesc = "Baixo risco de decantação física. Siga a ordem recomendada.";

  if (activeProducts.length > 4 || (temPo && temEC) || (temFertilizante && temEC)) {
    riskLevel = "high";
    statusText = "🔴 Risco Alto de Incompatibilidade";
    statusDesc = "Risco elevado de decantação, precipitação ou entupimento de bicos. Faça um pré-teste em garrafa.";
  } else if (activeProducts.length > 2 || temFertilizante || temPo) {
    riskLevel = "medium";
    statusText = "🟡 Risco Moderado (Alerta)";
    statusDesc = "Mantenha a agitação constante do tanque e utilize adjuvantes compatibilizantes.";
  }

  // Estatísticas para a rosca SVG
  const pctSeguro = riskLevel === "low" ? 100 : riskLevel === "medium" ? 60 : 30;
  const pctRisco = 100 - pctSeguro;

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "" && propriedade.trim() !== "" && nomeLaudo.trim() !== "";

  // Função para salvar o relatório no banco de dados
  const saveReport = async () => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'mistura-tanque',
          area: 'agricultura',
          inputs: { selectedIds },
          results: { activeProducts, riskLevel, statusText },
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
      initialInputsRef.current = { selectedIds, cliente, propriedade, nomeLaudo };
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
      pdf.save(`Ordem-Mistura-${cliente || "Laudo"}.pdf`);
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
              Ordem de Mistura de Tanque
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Selecione os agroquímicos e verifique a ordem padrão de despejo no pulverizador para evitar entupimento de bicos.
              <Link href="/ajuda#mistura-tanque" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
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
                  fileName={`Ordem-Mistura-${cliente || "Laudo"}`}
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
            
            {/* Bloco 1: Seleção de Defensivos */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Calda de Pulverização</h2>
                <p className="text-xs text-neutral-500 mt-1">Selecione todos os tipos de insumos que serão misturados no tanque</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATALOG_DEFENSIVOS.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleToggleProduct(product.id)}
                      className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 ${
                        isSelected 
                          ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20" 
                          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/30"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="font-bold text-xs text-neutral-800 uppercase tracking-wide">{product.name}</span>
                        <span className="text-[10px] bg-neutral-100 border border-neutral-250 font-extrabold uppercase px-2 py-0.5 rounded text-neutral-500">
                          {product.formulaType}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
                        {product.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco 2: Identificação do Laudo */}
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
                    placeholder="Ex: Mistura Milho Safrinha 2026"
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
                  Status de Compatibilidade da Calda
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold tracking-tight">
                    {statusText}
                  </span>
                </div>
                <p className="text-emerald-200 text-xs mt-2 leading-relaxed">
                  {statusDesc}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-emerald-900 pt-4 text-sm mb-6">
                  <div>
                    <span className="text-emerald-400 text-xs block">Total de Produtos</span>
                    <span className="font-bold text-lg mt-0.5 block text-white">
                      {activeProducts.length} itens
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-xs block">Risco de Entupimento</span>
                    <span className={`font-bold text-sm mt-1.5 block uppercase ${riskLevel === "high" ? "text-red-400 animate-pulse" : riskLevel === "medium" ? "text-amber-300" : "text-emerald-300"}`}>
                      {riskLevel === "high" ? "Crítico" : riskLevel === "medium" ? "Atenção" : "Seguro"}
                    </span>
                  </div>
                </div>

                {!isPro ? null : !isFormValid ? (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10">
                    ⚠️ Preencha o Produtor / Cliente para emitir o Laudo.
                  </div>
                ) : null}
              </div>

              {/* Detalhamento e Sequência de Ordem Recomendada */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-neutral-800 text-base">
                    Ordem de Abastecimento (Passo a Passo)
                  </h2>
                </div>

                {activeProducts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-2 bg-neutral-50 rounded-lg text-xs">
                      <span className="w-5 h-5 rounded-full bg-neutral-300 text-neutral-800 font-bold flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong className="text-neutral-800 block">Abastecimento de Água</strong>
                        <span className="text-neutral-500 mt-0.5 block">Encha o tanque do pulverizador com pelo menos 50% a 75% da capacidade de água antes de adicionar insumos. Ligue a agitação constante.</span>
                      </div>
                    </div>

                    {activeProducts.map((p, index) => (
                      <div key={p.id} className="flex items-start gap-3 p-2 border border-neutral-100 rounded-lg text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0">{index + 2}</span>
                        <div>
                          <strong className="text-neutral-800 block uppercase">{p.name}</strong>
                          <span className="text-neutral-500 mt-0.5 block">{p.description}</span>
                          <span className="text-[10px] text-emerald-800 font-extrabold uppercase mt-1 block">Tipo: {p.formulaType}</span>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-start gap-3 p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 text-white font-bold flex items-center justify-center shrink-0">{activeProducts.length + 2}</span>
                      <div>
                        <strong className="text-emerald-950 block">Completar Volume de Água</strong>
                        <span className="text-emerald-800 mt-0.5 block">Complete o restante da água com a agitação da calda ligada até o momento da aplicação.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-neutral-500 text-xs">
                    Selecione insumos ao lado para ver a sequência recomendada.
                  </div>
                )}
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
              A ordem de mistura de defensivos segue uma lógica físico-química padronizada mundialmente (Diretrizes do CropLife e FAO) para evitar reações de hidrólise, precipitação de sais e a formação de grumos insolúveis. A solubilidade e a formulação física de cada componente ditam a sua prioridade na calda.
            </p>

            <div className="bg-neutral-50 p-4 rounded-xl space-y-3 font-mono text-xs text-neutral-700">
              <div>
                <span className="text-emerald-800 font-bold block mb-1">Regra Padrão Universal de Ordem de Adição no Tanque:</span>
                1. <strong>Antiespumantes e Corretivos de Água</strong> (Preparam a calda física e pH)
                <br />
                2. <strong>Formulações Sólidas / Dispersíveis</strong> (WP, WG, DF) - Necessitam de hidratação vigorosa sob agitação
                <br />
                3. <strong>Formulações Suspensas / Dispersão Aquosa</strong> (SC, CS, ME) - Ingredientes ativos sólidos suspensos em líquido
                <br />
                4. <strong>Formulações Líquidas Emulsionáveis</strong> (EC, EW) - Formam emulsões estáveis após os sólidos estarem diluídos
                <br />
                5. <strong>Concentrados Solúveis</strong> (SL, Soluções líquidas homogêneas)
                <br />
                6. <strong>Adjuvantes e Óleos</strong> (Melhoram espalhamento e penetração)
                <br />
                7. <strong>Fertilizantes Foliares e Micronutrientes</strong> (Adicionados por último pois contêm sais que aumentam a condutividade e reduzem a solubilidade de outros ativos)
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
                <p suppressHydrationWarning><span className="font-bold text-neutral-800">Cód:</span> MIS-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
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
              Laudo Técnico de Ordem de Adição no Tanque
            </h2>

            {/* Grid de Ordem no PDF */}
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* Tabela de Produtos Adicionados (8 colunas) */}
              <div className="col-span-8 space-y-6">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700">
                      <th className="p-2 font-bold">Ordem</th>
                      <th className="p-2 font-bold">Insumo Selecionado</th>
                      <th className="p-2 font-bold">Formulações / Classe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr className="bg-neutral-50/50">
                      <td className="p-2 font-bold">1º</td>
                      <td className="p-2">Abastecimento de Água (50% a 75%)</td>
                      <td className="p-2 text-neutral-400">-</td>
                    </tr>
                    {activeProducts.map((p, index) => (
                      <tr key={p.id}>
                        <td className="p-2 font-bold">{index + 2}º</td>
                        <td className="p-2 font-semibold uppercase">{p.name}</td>
                        <td className="p-2 text-emerald-800 font-extrabold uppercase">{p.formulaType}</td>
                      </tr>
                    ))}
                    <tr className="bg-neutral-50/50">
                      <td className="p-2 font-bold">{activeProducts.length + 2}º</td>
                      <td className="p-2">Completar volume com Água e Agitar</td>
                      <td className="p-2 text-neutral-400">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Informações de Status e Risco no PDF (4 colunas) */}
              <div className="col-span-4 flex flex-col items-center justify-center border border-neutral-100 rounded-xl p-3 bg-neutral-50/30">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block text-center">Risco de Incompatibilidade</span>
                
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={riskLevel === "high" ? "#ef4444" : riskLevel === "medium" ? "#eab308" : "#10b981"}
                      strokeWidth="3.2"
                      strokeDasharray={`${pctSeguro} ${pctRisco}`}
                      strokeDashoffset="0"
                    />
                    <text
                      x="18"
                      y="18"
                      fontFamily="sans-serif"
                      fontSize="3.5"
                      fontWeight="800"
                      fill="#262626"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform="rotate(90 18 18)"
                    >
                      {riskLevel === "high" ? "CRÍTICO" : riskLevel === "medium" ? "MÉDIO" : "SEGURO"}
                    </text>
                  </svg>
                </div>

                <div className="mt-3 space-y-1 text-[8.5px] text-neutral-600 w-full text-center">
                  <p className="font-bold text-neutral-800 block uppercase mt-1">{statusText}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-neutral-55 border border-neutral-200 rounded-xl text-[10px] text-neutral-600 leading-relaxed font-mono">
              <strong>Nota Técnica e de Segurança:</strong>
              <br />
              {riskLevel === "high" ? (
                "Atenção: A mistura recomendada possui alta carga ou combinações potencialmente reativas (ex: sais fertilizantes com pós molháveis). Recomenda-se realizar o teste de pré-compatibilidade em recipiente menor (garrafa transparente) antes de despejar em grande quantidade no tanque de pulverização."
              ) : (
                "Siga a sequência de adição prescrita acima rigorosamente. Mantenha o sistema de agitação hidráulico ou mecânico do pulverizador constantemente ligado durante o processo de abastecimento e aplicação no campo."
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
