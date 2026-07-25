"use client";

import React, { useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';

interface ShareButtonProps {
  pdfBlob: Blob | null;
  fileName: string;
  nomeLaudo: string;
  responsavel: string;
  disabled?: boolean;
  onGeneratePdf?: () => Promise<Blob | null>;
}

export default function ShareButton({ 
  pdfBlob, 
  fileName, 
  nomeLaudo, 
  responsavel, 
  disabled,
  onGeneratePdf 
}: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      let activeBlob = pdfBlob;
      
      // Se não houver o blob gerado, tenta obter sob demanda
      if (!activeBlob && onGeneratePdf) {
        activeBlob = await onGeneratePdf();
      }

      if (!activeBlob) {
        alert('⚠️ Aguarde a geração do arquivo PDF do laudo para compartilhar.');
        return;
      }

      const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      const pdfFile = new File([activeBlob], safeName, { type: 'application/pdf' });

      // Dados para o compartilhamento contendo o PDF físico anexado
      const shareData: ShareData = {
        files: [pdfFile],
        title: `Laudo: ${nomeLaudo}`,
        text: `📄 Segue em anexo o laudo técnico do produtor.\n\n*${nomeLaudo}*\n👨‍🌾 Responsável: ${responsavel}`,
      };

      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        alert('⚠️ Seu navegador ou dispositivo não suporta o compartilhamento nativo de arquivos PDF.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // Cancelado pelo usuário
      console.error('Erro ao compartilhar Laudo nativamente:', err);
      alert('⚠️ Não foi possível abrir a folha de compartilhamento nativa.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing || disabled}
      className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 bg-amber-600 border border-transparent rounded-lg text-sm font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {sharing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4 mr-2" />
      )}
      {sharing ? 'Compartilhando...' : 'Compartilhar'}
    </button>
  );
}
