"use client";

import { useState, useEffect } from "react";
import { X, Upload, Check, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  altText: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (url: string, altText: string) => void;
}

export default function MediaLibraryModal({ isOpen, onClose, onSelectMedia }: MediaLibraryModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [altText, setAltText] = useState("");

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (data.items) {
        setMediaList(data.items);
      }
    } catch (err) {
      console.error("Erro ao carregar biblioteca de mídia:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", file.name);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.media) {
        setMediaList([data.media, ...mediaList]);
        setSelectedItem(data.media);
        setAltText(data.media.altText);
        // Inserção automática imediata após o upload!
        onSelectMedia(data.media.url, data.media.altText);
        onClose();
      } else {
        alert("Erro no upload: " + (data.error || "Servidor não retornou a mídia."));
      }
    } catch (err: any) {
      alert("Erro de envio: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteMedia = async () => {
    if (!selectedItem) return;
    const confirmDelete = window.confirm(`Tem certeza de que deseja excluir permanentemente a imagem "${selectedItem.filename}" da biblioteca?`);
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media?id=${selectedItem.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMediaList(mediaList.filter(item => item.id !== selectedItem.id));
        setSelectedItem(null);
        setAltText("");
      } else {
        alert("Erro ao excluir imagem: " + (data.error || "Erro desconhecido."));
      }
    } catch (err: any) {
      alert("Erro ao conectar: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmSelect = () => {
    if (selectedItem) {
      onSelectMedia(selectedItem.url, altText || selectedItem.altText);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header Modal WP Style */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-emerald-800" />
            <h3 className="font-extrabold text-base text-neutral-900">Biblioteca de Imagens</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo Modal */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Grade de Imagens (8 cols) */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow cursor-pointer transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando Imagem..." : "Enviar Nova Imagem"}
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-xs text-neutral-400 font-medium">
                {mediaList.length} mídia(s) cadastrada(s) • Clique duplo para usar
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-neutral-400">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-800" />
                <span className="text-xs mt-2 block">Carregando biblioteca...</span>
              </div>
            ) : mediaList.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-2xl p-8 space-y-2">
                <ImageIcon className="h-8 w-8 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-500 font-medium">Nenhuma imagem enviada ainda.</p>
                <p className="text-[11px] text-emerald-800 font-bold">Clique no botão "Enviar Nova Imagem" acima para fazer o upload.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {mediaList.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setAltText(item.altText);
                      }}
                      onDoubleClick={() => {
                        onSelectMedia(item.url, item.altText);
                        onClose();
                      }}
                      className={`relative aspect-square rounded-xl border-2 overflow-hidden cursor-pointer group transition-all ${
                        isSelected ? "border-emerald-600 ring-2 ring-emerald-400" : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <img src={item.url} alt={item.altText} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-emerald-600 text-white p-1 rounded-full shadow">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna Lateral de Detalhes da Mídia WP Style (4 cols) */}
          <div className="md:col-span-4 border-l border-neutral-200 pl-6 space-y-4">
            {selectedItem ? (
              <div className="space-y-4 text-xs">
                <h4 className="font-extrabold text-neutral-900 border-b pb-2">Detalhes do Anexo</h4>
                <div className="aspect-video rounded-xl border overflow-hidden bg-neutral-100">
                  <img src={selectedItem.url} alt={selectedItem.altText} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-neutral-400 block font-bold text-[10px]">Nome do arquivo:</span>
                  <span className="text-neutral-800 font-semibold break-all">{selectedItem.filename}</span>
                </div>
                
                {/* Campo Obrigatório de Alt Text (RN-010 / Seção D) */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">Texto Alternativo (Alt Text) *</label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Descreva a imagem para SEO e acessibilidade"
                    className="w-full border border-neutral-200 focus:border-emerald-600 rounded-lg p-2 text-xs"
                  />
                  <span className="text-[10px] text-neutral-400 block">Importante para acessibilidade e SEO do Google.</span>
                </div>

                <div className="pt-4 border-t border-neutral-200 space-y-2">
                  <button
                    onClick={handleConfirmSelect}
                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Usar esta Mídia
                  </button>

                  <button
                    onClick={handleDeleteMedia}
                    disabled={deleting}
                    className="w-full bg-red-50 border border-red-150 hover:bg-red-100 text-red-700 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-700" />}
                    Excluir Permanentemente
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-400 text-xs">
                Selecione uma imagem à esquerda para ver os detalhes e inserir no artigo.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
