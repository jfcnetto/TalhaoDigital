"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface UseTechnicalReportProps {
  toolId: string;
  area: "agricultura" | "pecuaria" | "financeiro";
  inputs: Record<string, any>;
  results: Record<string, any>;
  nomeLaudo: string;
  cliente: string;
  propriedade: string;
  responsavelTecnico: string;
  isPro: boolean;
  profileComplementar?: {
    creaCrtq?: string;
    conselhoEstado?: string;
    logoUrl?: string;
  } | null;
  reportRef: React.RefObject<HTMLDivElement>;
  pdfFileNamePrefix: string; // Ex: 'calagem-gessagem'
  onLoadReportData?: (inputs: any, clientData: any, professionalData: any) => void;
}

export function useTechnicalReport({
  toolId,
  area,
  inputs,
  results,
  nomeLaudo,
  cliente,
  propriedade,
  responsavelTecnico,
  isPro,
  profileComplementar,
  reportRef,
  pdfFileNamePrefix,
  onLoadReportData
}: UseTechnicalReportProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get("reportId");
  const autoDownload = searchParams.get("autoDownload");

  const [loadingSave, setLoadingSave] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  const initialInputsRef = useRef<any>(null);

  const isFormValid =
    responsavelTecnico.trim() !== "" &&
    cliente.trim() !== "" &&
    propriedade.trim() !== "" &&
    nomeLaudo.trim() !== "";

  // 1. Carregar dados de um laudo antigo (Reabrir / Duplicar)
  useEffect(() => {
    if (reportId && onLoadReportData) {
      fetch(`/api/reports/${reportId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erro ao carregar");
          return res.json();
        })
        .then((data) => {
          if (data && data.inputs && data.clientData) {
            onLoadReportData(data.inputs, data.clientData, data.professionalData || {});
            
            // Grava o estado inicial carregado do banco para controle de alterações
            initialInputsRef.current = {
              ...data.inputs,
              cliente: data.clientData.cliente || "",
              propriedade: data.clientData.propriedade || "",
              nomeLaudo: data.clientData.nomeLaudo || "",
              responsavel: data.professionalData?.responsavel || ""
            };
            setIsSaved(true);

            // Gera o PDF silenciosamente em segundo plano para o botão Compartilhar
            setTimeout(() => {
              handleGerarPdf(true);
            }, 1200);
          }
        })
        .catch((err) => console.error("Erro ao carregar laudo do histórico:", err));
    }
  }, [reportId]);

  // 2. Monitorar alterações nos inputs para invalidar o status de salvo
  useEffect(() => {
    if (initialInputsRef.current) {
      const currentSnapshot: Record<string, any> = {
        ...inputs,
        cliente,
        propriedade,
        nomeLaudo,
        responsavel: responsavelTecnico
      };

      let isDifferent = false;
      for (const key in initialInputsRef.current) {
        if (JSON.stringify(initialInputsRef.current[key]) !== JSON.stringify(currentSnapshot[key])) {
          isDifferent = true;
          break;
        }
      }

      if (isDifferent) {
        setIsSaved(false);
        initialInputsRef.current = null;
        setPdfBlob(null); // Limpa o blob anterior para forçar nova geração
      }
    } else {
      setIsSaved(false);
    }
  }, [inputs, cliente, propriedade, nomeLaudo, responsavelTecnico]);

  // 3. Função para salvar o relatório no banco de dados
  const saveReport = async () => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          area,
          inputs,
          results,
          professionalData: {
            responsavel: responsavelTecnico,
            creaCrtq: profileComplementar?.creaCrtq || "",
            conselhoEstado: profileComplementar?.conselhoEstado || "",
            logoUrl: profileComplementar?.logoUrl || ""
          },
          clientData: {
            cliente,
            propriedade,
            nomeLaudo
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

  // 4. Botão para salvar explicitamente
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
        ...inputs,
        cliente,
        propriedade,
        nomeLaudo,
        responsavel: responsavelTecnico
      };
      setIsSaved(true);
      router.refresh();
      alert("✅ Laudo técnico gravado no seu histórico com sucesso!");
      
      // Gera o PDF silenciosamente em segundo plano para habilitar o botão Compartilhar (sem download físico)
      setTimeout(() => {
        handleGerarPdf(true);
      }, 300);
    } else {
      alert("⚠️ Não foi possível salvar o laudo na nuvem (sem conexão à internet ou sessão expirada). O laudo não pôde ser gravado no seu histórico online.");
    }
  };

  // 5. Botão para imprimir
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

  // 6. Botão para gerar e exportar PDF (silenciosamente ou com download físico)
  const handleGerarPdf = async (skipSave = false): Promise<Blob | null> => {
    if (!isPro) {
      window.location.href = "/#planos";
      return null;
    }
    if (!isFormValid) {
      setShowValidationError(true);
      return null;
    }
    setShowValidationError(false);

    if (gerandoPdf) return null;
    setGerandoPdf(true);

    try {
      if (!skipSave) {
        const saved = await saveReport();
        if (!saved) {
          const proceed = window.confirm("⚠️ Não foi possível salvar o laudo no banco de dados. Deseja prosseguir com a geração do PDF local mesmo assim?");
          if (!proceed) return null;
        }
      }

      const element = reportRef.current;
      if (!element) return null;

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
      
      const blob = pdf.output("blob");
      setPdfBlob(blob);

      // Se NÃO for gravação silenciosa em background, inicia o download físico do PDF
      if (skipSave === false) {
        const sanitizedLaudoName = nomeLaudo.replace(/\s+/g, "-").toLowerCase();
        pdf.save(`${pdfFileNamePrefix}-${sanitizedLaudoName}.pdf`);
      }

      return blob;
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      if (skipSave === false) {
        alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
      }
      return null;
    } finally {
      setGerandoPdf(false);
    }
  };

  // 7. Disparo automático do PDF se autoDownload=true estiver na URL
  useEffect(() => {
    if (reportId && autoDownload === "true" && isPro && isFormValid) {
      const timer = setTimeout(() => {
        handleGerarPdf(true).then(() => {
          router.push("/dashboard/laudos");
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [reportId, autoDownload, isPro, isFormValid]);

  return {
    isSaved,
    loadingSave,
    pdfBlob,
    gerandoPdf,
    showValidationError,
    setShowValidationError,
    isFormValid,
    handleSaveOnly,
    handleImprimir,
    handleGerarPdf
  };
}
