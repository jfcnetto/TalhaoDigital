"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Lock, Download, Info, HelpCircle, Save } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BalanceadorNpkClientProps {
  isPro: boolean;
  userName?: string;
}

export default function BalanceadorNpkClient({ isPro, userName }: BalanceadorNpkClientProps) {
  // Loading state para salvar
  const [loadingSave, setLoadingSave] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const initialInputsRef = useRef<any>(null);

  // Configuração Alvo
  const [metaN, setMetaN] = useState<number>(4);
  const [metaP, setMetaP] = useState<number>(14);
  const [metaK, setMetaK] = useState<number>(8);
  
  // Garantia das Fontes (Matérias-primas)
  const [fonteN, setFonteN] = useState<number>(45); // Ureia padrão 45%
  const [fonteP, setFonteP] = useState<number>(18); // Super Simples padrão 18%
  const [fonteK, setFonteK] = useState<number>(60); // KCl padrão 60%

  // Cálculo das proporções ativas
  const propUreia = (metaN / 100) / (fonteN / 100);
  const propSS = (metaP / 100) / (fonteP / 100);
  const propKCl = (metaK / 100) / (fonteK / 100);
  const propTotal = propUreia + propSS + propKCl;

  // Peso mínimo absoluto necessário para começar a mistura (ex: 1000 kg para a fórmula padrão)
  const getMinNecessario = (n: number, p: number, k: number, fN: number, fP: number, fK: number) => {
    const pU = (n / 100) / (fN / 100);
    const pS = (p / 100) / (fP / 100);
    const pK = (k / 100) / (fK / 100);
    return Math.round(1000 * (pU + pS + pK));
  };

  const initialMin = getMinNecessario(4, 14, 8, 45, 18, 60);
  const [quantidadeDesejada, setQuantidadeDesejada] = useState<number>(1000); // Inicializado com o valor padrão viável (1000 kg)

  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');
  const autoDownload = searchParams.get('autoDownload');

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

  useEffect(() => {
    if (userName) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          setProfile(data);
          if (data.name) {
            setResponsavel(data.name);
          }
        })
        .catch((err) => console.error("Erro ao buscar perfil complementar:", err));
    }
  }, [userName]);

  // Carregar dados de um laudo antigo (Reabrir / Duplicar)
  useEffect(() => {
    if (reportId) {
      fetch(`/api/reports/${reportId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erro ao carregar");
          return res.json();
        })
        .then((data) => {
          if (data?.inputs && data?.clientData) {
            setMetaN(Number(data.inputs.metaN || 0));
            setMetaP(Number(data.inputs.metaP || 0));
            setMetaK(Number(data.inputs.metaK || 0));
            setFonteN(Number(data.inputs.fonteN || 0));
            setFonteP(Number(data.inputs.fonteP || 0));
            setFonteK(Number(data.inputs.fonteK || 0));
            setQuantidadeDesejada(Number(data.inputs.quantidadeDesejada || 1000));
            setCliente(data.clientData.cliente || "");
            setPropriedade(data.clientData.propriedade || "");
            setNomeLaudo(data.clientData.nomeLaudo || "");
            if (data.professionalData?.responsavel) {
              setResponsavel(data.professionalData.responsavel);
            }
            // Salva como estado inicial carregado do banco
            initialInputsRef.current = {
              metaN: Number(data.inputs.metaN || 0),
              metaP: Number(data.inputs.metaP || 0),
              metaK: Number(data.inputs.metaK || 0),
              fonteN: Number(data.inputs.fonteN || 0),
              fonteP: Number(data.inputs.fonteP || 0),
              fonteK: Number(data.inputs.fonteK || 0),
              quantidadeDesejada: Number(data.inputs.quantidadeDesejada || 1000),
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

  // Monitorar alterações nos inputs para invalidar o status de salvo
  useEffect(() => {
    if (initialInputsRef.current) {
      const isDifferent = 
        metaN !== initialInputsRef.current.metaN ||
        metaP !== initialInputsRef.current.metaP ||
        metaK !== initialInputsRef.current.metaK ||
        fonteN !== initialInputsRef.current.fonteN ||
        fonteP !== initialInputsRef.current.fonteP ||
        fonteK !== initialInputsRef.current.fonteK ||
        quantidadeDesejada !== initialInputsRef.current.quantidadeDesejada ||
        cliente !== initialInputsRef.current.cliente ||
        propriedade !== initialInputsRef.current.propriedade ||
        nomeLaudo !== initialInputsRef.current.nomeLaudo;
      
      if (isDifferent) {
        setIsSaved(false);
        initialInputsRef.current = null;
      }
    } else {
      setIsSaved(false);
    }
  }, [metaN, metaP, metaK, fonteN, fonteP, fonteK, quantidadeDesejada, cliente, propriedade, nomeLaudo]);

  // Função para salvar o relatório no banco de dados
  const saveReport = async () => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'npk-balance',
          area: 'agricultura',
          inputs: {
            metaN,
            metaP,
            metaK,
            fonteN,
            fonteP,
            fonteK,
            quantidadeDesejada
          },
          results: {
            massaUreia,
            massaSS,
            massaKCl,
            massaEnchimento,
            totalMassa,
            pctUreia,
            pctSS,
            pctKCl,
            pctEnchimento,
            possivel
          },
          professionalData: {
            responsavel: responsavel,
            creaCrtq: "",
            conselhoEstado: "",
            logoUrl: ""
          },
          clientData: {
            cliente: cliente,
            propriedade: propriedade,
            nomeLaudo: nomeLaudo
          }
        })
      });
      if (!res.ok) return false;
      return true;
    } catch (err) {
      console.error("Erro ao salvar laudo no banco:", err);
      return false;
    }
  };

  // Botão para salvar explicitamente sem imprimir ou baixar
  const handleSaveOnly = async () => {
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    setLoadingSave(true);
    const saved = await saveReport();
    setLoadingSave(false);

    if (saved) {
      initialInputsRef.current = {
        metaN,
        metaP,
        metaK,
        fonteN,
        fonteP,
        fonteK,
        quantidadeDesejada,
        cliente,
        propriedade,
        nomeLaudo
      };
      setIsSaved(true);
      router.refresh();
      alert("✅ Laudo técnico gravado no seu histórico com sucesso!");
    } else {
      alert("⚠️ Não foi possível salvar o laudo na nuvem (sem conexão à internet ou sessão expirada). O laudo não pôde ser gravado no seu histórico online.");
    }
  };

  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [showValidationError, setShowValidationError] = useState<boolean>(false);

  // A mistura é viável se a soma das proporções for <= 100% (com tolerância de float de 0.01%)
  const possivel = propTotal <= 1.0001;

  // Valores Mínimos e Máximos Dinâmicos baseados nas proporções físicas
  const volumeMinimoRequerido = Math.round(1000 * propTotal);
  const volumeMaximoPermitido = 50000; // Limite operacional máximo (50 toneladas)

  // Verifica se o valor digitado está dentro dos limites aceitáveis
  const quantidadeValida = quantidadeDesejada >= volumeMinimoRequerido && quantidadeDesejada <= volumeMaximoPermitido;

  // Massa de matéria-prima real em kg
  const massaUreia = (metaN / 100) * quantidadeDesejada / (fonteN / 100);
  const massaSS = (metaP / 100) * quantidadeDesejada / (fonteP / 100);
  const massaKCl = (metaK / 100) * quantidadeDesejada / (fonteK / 100);
  
  // Arredonda para 2 casas para exibição e validações de soma de pesos
  const totalMassa = Math.round((massaUreia + massaSS + massaKCl) * 100) / 100;
  const massaEnchimento = possivel && quantidadeDesejada >= totalMassa ? quantidadeDesejada - totalMassa : 0;

  // Variáveis para o Gráfico (SVG) Base 100%
  const chartTotal = possivel ? quantidadeDesejada : totalMassa;
  
  const pctUreia = chartTotal > 0 ? (massaUreia / chartTotal) * 100 : 0;
  const pctSS = chartTotal > 0 ? (massaSS / chartTotal) * 100 : 0;
  const pctKCl = chartTotal > 0 ? (massaKCl / chartTotal) * 100 : 0;
  const pctEnchimento = possivel && chartTotal > 0 ? (massaEnchimento / chartTotal) * 100 : 0;

  const isFormValid = responsavel.trim() !== "" && cliente.trim() !== "" && propriedade.trim() !== "" && nomeLaudo.trim() !== "";
  const validToExport = isFormValid && possivel && quantidadeValida;

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
      const proceed = window.confirm("⚠️ Não foi possível salvar o laudo no banco de dados (provavelmente você está offline ou sem sinal). Deseja abrir a tela de impressão local mesmo assim?");
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
          const proceed = window.confirm("⚠️ Não foi possível salvar o laudo no banco de dados (provavelmente você está offline ou sem sinal). Deseja prosseguir com a geração do PDF local mesmo assim?");
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
      pdf.save(`Balanceamento-NPK-${cliente || "Laudo"}.pdf`);
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
              onClick={() => {
                router.push('/dashboard');
                router.refresh();
              }}
              className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao Dashboard
            </button>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Balanceador de Formulação NPK
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Calcule a quantidade exata de matérias-primas para formular o seu adubo.
              <Link href="/ajuda#balanceador-npk" className="text-emerald-600 hover:underline font-bold text-xs ml-1.5">
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
                  fileName={`Balanceamento-NPK-${cliente || "Laudo"}`}
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
            
            {/* Bloco 1: Meta da Formulação */}
            <div className="space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Fórmula Desejada (Alvo)</h2>
                <p className="text-xs text-neutral-500 mt-1">Insira a garantia N-P-K do produto final</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">N (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={metaN || ""}
                    onChange={(e) => setMetaN(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">P₂O₅ (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={metaP || ""}
                    onChange={(e) => setMetaP(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">K₂O (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={metaK || ""}
                    onChange={(e) => setMetaK(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Quantidade a Produzir (kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={volumeMinimoRequerido}
                    max={volumeMaximoPermitido}
                    step="100"
                    value={quantidadeDesejada || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuantidadeDesejada(val);
                    }}
                    onBlur={() => {
                      // Se o usuário digitou abaixo do mínimo, corrige para o mínimo real da fórmula
                      if (quantidadeDesejada < volumeMinimoRequerido) {
                        setQuantidadeDesejada(volumeMinimoRequerido);
                      } else if (quantidadeDesejada > volumeMaximoPermitido) {
                        setQuantidadeDesejada(volumeMaximoPermitido);
                      }
                    }}
                    className={`w-full pl-3 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm ${!quantidadeValida ? "border-amber-400 bg-amber-50" : "border-neutral-300"}`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500 sm:text-sm font-medium">kg</span>
                  </div>
                </div>
                {!quantidadeValida && (
                  <p className="text-xs font-semibold text-amber-700 mt-2">
                    ⚠️ Orientação: O valor deve ser entre {volumeMinimoRequerido.toLocaleString("pt-BR")} kg no mínimo e {volumeMaximoPermitido.toLocaleString("pt-BR")} kg no máximo.
                  </p>
                )}
              </div>
            </div>

            {/* Bloco 2: Fontes Disponíveis */}
            <div className="space-y-4 pt-4">
              <div className="border-b pb-3 border-neutral-100">
                <h2 className="font-bold text-lg text-neutral-800">Fontes Disponíveis (Garantias)</h2>
                <p className="text-xs text-neutral-500 mt-1">Teor de nutrientes de cada matéria-prima</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <span className="text-sm font-bold text-neutral-800">Fonte de N</span>
                    <p className="text-[10px] text-neutral-500 uppercase">Ex: Ureia</p>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={fonteN || ""}
                      onChange={(e) => setFonteN(Number(e.target.value))}
                      className="w-full pl-3 pr-8 py-2 border border-neutral-300 rounded-lg text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">%</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <span className="text-sm font-bold text-neutral-800">Fonte de P</span>
                    <p className="text-[10px] text-neutral-500 uppercase">Ex: Super Simples</p>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={fonteP || ""}
                      onChange={(e) => setFonteP(Number(e.target.value))}
                      className="w-full pl-3 pr-8 py-2 border border-neutral-300 rounded-lg text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">%</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <span className="text-sm font-bold text-neutral-800">Fonte de K</span>
                    <p className="text-[10px] text-neutral-500 uppercase">Ex: KCl</p>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={fonteK || ""}
                      onChange={(e) => setFonteK(Number(e.target.value))}
                      className="w-full pl-3 pr-8 py-2 border border-neutral-300 rounded-lg text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">%</div>
                  </div>
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
                    onChange={(e) => {
                      setResponsavel(e.target.value);
                      if (cliente.trim() !== "" && e.target.value.trim() !== "" && propriedade.trim() !== "" && nomeLaudo.trim() !== "") setShowValidationError(false);
                    }}
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
                    placeholder="Nome do produtor"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && cliente.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
                  />
                </div>
                <div>
                  <label htmlFor="propriedade" className="block text-xs font-bold text-neutral-700 uppercase mb-1">Propriedade / Fazenda *</label>
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
                  <label htmlFor="nomeLaudo" className="block text-xs font-bold text-neutral-700 uppercase mb-1">Nome do Laudo *</label>
                  <input
                    type="text"
                    value={nomeLaudo}
                    onChange={(e) => {
                      setNomeLaudo(e.target.value);
                      if (e.target.value.trim() !== "" && responsavel.trim() !== "" && cliente.trim() !== "" && propriedade.trim() !== "") setShowValidationError(false);
                    }}
                    placeholder="Ex: Fórmula Milho 2026"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${showValidationError && nomeLaudo.trim() === "" ? "border-red-500 bg-red-50" : "border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"}`}
                  />
                </div>
              </div>
              {showValidationError && (
                <p className="text-[11px] font-medium text-red-600 animate-pulse mt-2">
                  ⚠️ Os campos Responsável Técnico, Produtor / Cliente, Propriedade / Fazenda e Identificação do Laudo são obrigatórios para emitir laudos e relatórios.
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
                  Mistura Final ({quantidadeDesejada.toLocaleString("pt-BR")} kg)
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {metaN}-{metaP}-{metaK}
                  </span>
                  <span className="text-lg text-emerald-300 font-semibold">NPK</span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-emerald-900 pt-4 text-sm mb-6">
                  <div>
                    <span className="text-emerald-400 text-xs block">Massa de Fertilizantes</span>
                    <span className="font-bold text-lg mt-0.5 block text-white">
                      {(massaUreia + massaSS + massaKCl).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-xs block">Enchimento (Inerte)</span>
                    <span className="font-bold text-lg mt-0.5 block text-emerald-200">
                      {possivel ? massaEnchimento.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "0"} kg
                    </span>
                  </div>
                </div>

                {/* O aviso vermelho foi removido daqui para evitar redundância e confusão */}

                {isPro && !isFormValid && (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/40 border border-red-500/30 text-xs text-red-200 relative z-10 animate-pulse">
                    ⚠️ Preencha o Responsável, Produtor e a Propriedade para emitir o Laudo.
                  </div>
                )}
                {isPro && isFormValid && !isSaved && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-900/40 border border-amber-500/30 text-xs text-amber-200 relative z-10 animate-pulse">
                    ⚠️ Clique em "Salvar" no topo para gravar no histórico e liberar a emissão do Laudo.
                  </div>
                )}
              </div>

              {/* Detalhamento das Fontes e Gráfico SVG */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-3 border-neutral-100">
                  <h2 className="font-bold text-neutral-850 text-base">
                    Composição da Mistura
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Gráfico SVG de composição */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                        {/* N (Ureia) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3.2"
                          strokeDasharray={`${pctUreia} ${100 - pctUreia}`}
                          strokeDashoffset="0"
                          className="transition-all duration-300"
                        />
                        {/* P (SS) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3.2"
                          strokeDasharray={`${pctSS} ${100 - pctSS}`}
                          strokeDashoffset={`-${pctUreia}`}
                          className="transition-all duration-300"
                        />
                        {/* K (KCl) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="3.2"
                          strokeDasharray={`${pctKCl} ${100 - pctKCl}`}
                          strokeDashoffset={`-${pctUreia + pctSS}`}
                          className="transition-all duration-300"
                        />
                        {/* Enchimento */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="#a3a3a3"
                          strokeWidth="3.2"
                          strokeDasharray={`${pctEnchimento} ${100 - pctEnchimento}`}
                          strokeDashoffset={`-${pctUreia + pctSS + pctKCl}`}
                          className="transition-all duration-300"
                        />
                        <text
                          x="18"
                          y="16.5"
                          fontFamily="sans-serif"
                          fontSize="5.5"
                          fontWeight="800"
                          fill="#262626"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform="rotate(90 18 18)"
                        >
                          {metaN}-{metaP}-{metaK}
                        </text>
                        <text
                          x="18"
                          y="22"
                          fontFamily="sans-serif"
                          fontSize="3"
                          fontWeight="700"
                          fill="#a3a3a3"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform="rotate(90 18 18)"
                        >
                          NPK
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Tabela Resumo (7 colunas) */}
                  <div className="md:col-span-7 space-y-3">
                  <div className="flex justify-between items-center p-2 rounded bg-emerald-50 border border-emerald-100 text-sm">
                    <div className="flex gap-2 items-center">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-medium text-emerald-900">Fonte N</span>
                    </div>
                    <span className="font-bold text-emerald-900">{massaUreia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-blue-50 border border-blue-100 text-sm">
                    <div className="flex gap-2 items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                      <span className="font-medium text-blue-900">Fonte P</span>
                    </div>
                    <span className="font-bold text-blue-900">{massaSS.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-yellow-50 border border-yellow-100 text-sm">
                    <div className="flex gap-2 items-center">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                      <span className="font-medium text-yellow-900">Fonte K</span>
                    </div>
                    <span className="font-bold text-yellow-900">{massaKCl.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</span>
                  </div>
                  
                  {possivel && massaEnchimento > 0 && (
                    <div className="flex justify-between items-center p-2 rounded bg-neutral-100 border border-neutral-200 text-sm">
                      <div className="flex gap-2 items-center">
                        <span className="w-3 h-3 rounded-full bg-neutral-400 shrink-0" />
                        <span className="font-medium text-neutral-700">Enchimento (Inerte)</span>
                      </div>
                      <span className="font-bold text-neutral-700">{massaEnchimento.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-2 rounded bg-neutral-800 text-white text-sm mt-4">
                    <span className="font-bold">Massa Total</span>
                    <span className="font-extrabold">{totalMassa > quantidadeDesejada ? totalMassa.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : quantidadeDesejada.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</span>
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
                O cálculo de balanceamento de fertilizantes busca encontrar a quantidade exata de cada matéria-prima (fontes simples ou compostas) para atingir a garantia mínima desejada da formulação final por hectare ou volume de mistura.
              </p>

              <div className="bg-neutral-50 p-4 rounded-xl space-y-3 font-mono text-xs text-neutral-700">
                <div>
                  <span className="text-emerald-800 font-bold block mb-1">1. Requerimento do Nutriente N (Ureia {fonteN}%):</span>
                  Massa de Ureia = ({quantidadeDesejada} kg * ({metaN}% / 100)) / ({fonteN}% / 100) = {massaUreia.toFixed(1)} kg
                </div>
                
                <div className="pt-3 border-t border-neutral-200">
                  <span className="text-blue-800 font-bold block mb-1">2. Requerimento do Nutriente P₂O₅ (Super Simples {fonteP}%):</span>
                  Massa de Super Simples = ({quantidadeDesejada} kg * ({metaP}% / 100)) / ({fonteP}% / 100) = {massaSS.toFixed(1)} kg
                </div>

                <div className="pt-3 border-t border-neutral-200">
                  <span className="text-yellow-800 font-bold block mb-1">3. Requerimento do Nutriente K₂O (KCl {fonteK}%):</span>
                  Massa de KCl = ({quantidadeDesejada} kg * ({metaK}% / 100)) / ({fonteK}% / 100) = {massaKCl.toFixed(1)} kg
                </div>

                <div className="pt-3 border-t border-neutral-200">
                  <span className="text-neutral-900 font-bold block mb-1">4. Material de Enchimento (Inerte / Veículo):</span>
                  Enchimento = {quantidadeDesejada} kg - ({massaUreia.toFixed(1)} kg + {massaSS.toFixed(1)} kg + {massaKCl.toFixed(1)} kg) = {possivel ? massaEnchimento.toFixed(1) : 0} kg
                </div>
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
              <div className="flex items-center gap-4">
                {profile?.logoUrl && (
                  <img 
                    src={profile.logoUrl} 
                    alt="Logo Agrônomo" 
                    className="h-12 w-auto object-contain max-w-[150px] mr-2" 
                  />
                )}
                <div>
                  <h1 className="text-2xl font-black text-emerald-800 tracking-tighter">
                    Talhão<span className="text-neutral-800">Digital</span>
                  </h1>
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest mt-1">
                    Laudos e Diagnósticos Agronômicos de Precisão
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-neutral-500">
                <p suppressHydrationWarning><span className="font-bold text-neutral-800">Data:</span> {new Date().toLocaleDateString("pt-BR")}</p>
                <p suppressHydrationWarning><span className="font-bold text-neutral-800">Cód:</span> NPK-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
              </div>
            </div>

            {/* Identificação */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs space-y-3 mb-8">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Responsável Técnico</p>
                  <p className="font-bold text-neutral-800 text-sm uppercase flex flex-col">
                    <span>{responsavel || "Não informado"}</span>
                    {profile?.creaCrtq && (
                      <span className="text-[10px] text-neutral-500 font-bold tracking-normal mt-0.5 normal-case">
                        CREA/CRTQ: {profile.creaCrtq}/{profile.conselhoEstado}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Produtor / Cliente</p>
                  <p className="font-bold text-neutral-800 text-sm uppercase">{cliente || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Propriedade / Fazenda</p>
                  <p className="font-bold text-neutral-800 text-sm uppercase">{propriedade || "Não Informada"}</p>
                </div>
              </div>
              <div className="pt-2.5 border-t border-neutral-200/60 text-xs">
                <span className="text-neutral-400 block font-bold uppercase text-[9px] tracking-wider mb-1">Nome do Laudo</span>
                <span className="font-bold text-neutral-850 text-sm">Balanceador NPK - {nomeLaudo}</span>
              </div>
            </div>

            {/* Título Principal */}
            <h2 className="text-xl font-bold text-neutral-800 border-b pb-2 mb-6">
              Balanceamento de Mistura NPK
            </h2>

            {/* GRID 12 Colunas (Tabela à esquerda, SVG à direita) */}
            <div className="grid grid-cols-12 gap-6 items-center">
              
              {/* Tabela de Resultados (8 colunas) */}
              <div className="col-span-8 space-y-6">
                
                {/* Metas */}
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700">
                      <th className="p-2 font-bold">Fórmula Desejada (Alvo)</th>
                      <th className="p-2 font-bold text-right">Garantia (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr><td className="p-2">Nitrogênio (N)</td><td className="p-2 text-right font-bold">{metaN}%</td></tr>
                    <tr><td className="p-2">Fósforo (P₂O₅)</td><td className="p-2 text-right font-bold">{metaP}%</td></tr>
                    <tr><td className="p-2">Potássio (K₂O)</td><td className="p-2 text-right font-bold">{metaK}%</td></tr>
                    <tr className="bg-neutral-50"><td className="p-2 font-bold">Total a Produzir</td><td className="p-2 text-right font-bold text-sm">{quantidadeDesejada} kg</td></tr>
                  </tbody>
                </table>

                {/* Quantidades a Misturar */}
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-800">
                      <th className="p-2 font-bold">Matéria-Prima Necessária</th>
                      <th className="p-2 font-bold text-right">Quantidade (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    <tr><td className="p-2">Fonte de N (Garantia: {fonteN}%)</td><td className="p-2 text-right font-bold text-emerald-900">{massaUreia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</td></tr>
                    <tr><td className="p-2">Fonte de P (Garantia: {fonteP}%)</td><td className="p-2 text-right font-bold text-emerald-900">{massaSS.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</td></tr>
                    <tr><td className="p-2">Fonte de K (Garantia: {fonteK}%)</td><td className="p-2 text-right font-bold text-emerald-900">{massaKCl.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</td></tr>
                    <tr className="bg-neutral-100 text-neutral-800"><td className="p-2 font-bold rounded-l">Material de Enchimento (Inerte)</td><td className="p-2 text-right font-bold rounded-r">{possivel ? massaEnchimento.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : 0} kg</td></tr>
                    <tr className="bg-emerald-800 text-white"><td className="p-2 font-bold rounded-l">Total da Mistura</td><td className="p-2 text-right font-bold rounded-r text-sm">{possivel ? quantidadeDesejada : totalMassa.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Gráfico SVG (4 colunas) no PDF */}
              <div className="col-span-4 flex flex-col items-center justify-center border border-neutral-100 rounded-xl p-3 bg-neutral-50/30">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block text-center">Composição da Mistura</span>
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
                      strokeDasharray={`${pctUreia} ${100 - pctUreia}`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3.5"
                      strokeDasharray={`${pctSS} ${100 - pctSS}`}
                      strokeDashoffset={`-${pctUreia}`}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="3.5"
                      strokeDasharray={`${pctKCl} ${100 - pctKCl}`}
                      strokeDashoffset={`-${pctUreia + pctSS}`}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="3.5"
                      strokeDasharray={`${pctEnchimento} ${100 - pctEnchimento}`}
                      strokeDashoffset={`-${pctUreia + pctSS + pctKCl}`}
                    />
                    
                    <text
                      x="18"
                      y="16.5"
                      fontFamily="sans-serif"
                      fontSize="6"
                      fontWeight="800"
                      fill="#262626"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform="rotate(90 18 18)"
                    >
                      {possivel ? quantidadeDesejada : totalMassa.toFixed(0)}
                    </text>
                    <text
                      x="18"
                      y="22"
                      fontFamily="sans-serif"
                      fontSize="3"
                      fontWeight="700"
                      fill="#a3a3a3"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform="rotate(90 18 18)"
                    >
                      KG TOTAIS
                    </text>
                  </svg>
                </div>
                
                {/* Legendas do Gráfico no PDF */}
                <div className="mt-3 space-y-1 text-[8px] text-neutral-600 w-full font-medium">
                  <div className="flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> <span>Fonte N</span>
                    </div>
                    <span>{pctUreia.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" /> <span>Fonte P</span>
                    </div>
                    <span>{pctSS.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" /> <span>Fonte K</span>
                    </div>
                    <span>{pctKCl.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" /> <span>Enchimento</span>
                    </div>
                    <span>{pctEnchimento.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {!possivel && (
               <div className="mt-8 p-4 border rounded-xl bg-red-50 text-xs text-red-800">
                  <strong>AVISO:</strong> A fórmula solicitada ({metaN}-{metaP}-{metaK}) não é possível de ser fabricada com as concentrações das fontes fornecidas. O volume de matéria-prima excede o total desejado de {quantidadeDesejada}kg.
               </div>
            )}
            
            <div className="mt-8 p-4 border rounded-xl bg-neutral-50 text-xs text-neutral-600">
              <strong className="block mb-1 text-neutral-800">Metodologia de Cálculo de Mistura</strong>
              As massas foram calculadas considerando as garantias (%) de cada fonte, definindo assim a exata proporção de fertilizantes para atingir os teores exigidos.
            </div>

            {/* Footer do PDF */}
            <div className="mt-auto pt-8 flex justify-between items-center text-[9px] text-neutral-400 font-medium">
              <p>Documento gerado digitalmente pela plataforma Talhão Digital.</p>
              <p>www.talhaodigital.com.br</p>
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
