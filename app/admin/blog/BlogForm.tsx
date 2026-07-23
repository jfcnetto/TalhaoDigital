"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, Loader2, Image } from "lucide-react";
import Link from "next/link";
import TiptapEditor from "@/components/TiptapEditor";

interface BlogFormProps {
  post?: any; // Se existir, estamos editando
}

export default function BlogForm({ post }: BlogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [summary, setSummary] = useState(post?.summary || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [category, setCategory] = useState<"agricultura" | "pecuaria" | "financeiro">(post?.category || "agricultura");
  const [status, setStatus] = useState<"draft" | "published">(post?.status || "draft");
  const [contentHtml, setContentHtml] = useState(post?.contentHtml || "");
  const [contentJson, setContentJson] = useState<any>(post?.contentJson || null);
  
  // SEO States
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription || "");

  const [uploadingCover, setUploadingCover] = useState(false);

  // Gera slug automaticamente a partir do título
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!post) {
      // Apenas auto-gera se for post novo
      const generated = val
        .toLowerCase()
        .trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
        .replace(/\s+/g, '-') // espaços para traços
        .replace(/-+/g, '-'); // evita traços duplicados
      setSlug(generated);
    }
  };

  // Upload da Imagem de Capa para o Cloudflare R2
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no upload da capa");
      if (data.url) setCoverImage(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingCover(false);
    }
  };

  // Salvar Postagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !contentHtml.trim() || !coverImage.trim()) {
      setError("Por favor, preencha todos os campos obrigatórios (Título, Slug, Capa e Conteúdo).");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      id: post?.id,
      title,
      slug,
      summary,
      contentHtml,
      contentJson,
      coverImage,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || summary,
      category,
      status,
    };

    try {
      const res = await fetch("/api/admin/blog", {
        method: post ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar postagem");

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      
      {/* Botão Voltar & Ações Rápidas */}
      <div className="flex justify-between items-center">
        <Link 
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Painel
        </Link>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-3 shadow transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {post ? "Salvar Alterações" : "Publicar Artigo"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Grid de Inputs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Coluna Principal Form (2/3 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-neutral-800 text-sm uppercase tracking-wider border-b pb-2 border-neutral-100">
              Conteúdo do Artigo
            </h3>
            
            {/* Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Título do Post *</label>
              <input
                type="text"
                placeholder="Ex: Guia Completo de Calagem do Solo"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2.5 text-sm shadow-sm transition-colors"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Slug da URL *</label>
              <input
                type="text"
                placeholder="ex-guia-completo-calagem"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2.5 text-sm shadow-sm transition-colors font-mono text-xs"
                required
              />
            </div>

            {/* Resumo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Resumo Curto (Pré-visualização) *</label>
              <textarea
                rows={3}
                placeholder="Uma breve introdução sobre o artigo que aparecerá na listagem do blog..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
                required
              />
            </div>

            {/* Corpo do Post com Tiptap Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Corpo do Artigo *</label>
              <TiptapEditor 
                content={contentHtml} 
                onChange={(html, json) => {
                  setContentHtml(html);
                  setContentJson(json);
                }} 
              />
            </div>
          </div>
        </div>

        {/* Coluna Configurações Laterais (1/3 col) */}
        <div className="space-y-6">
          
          {/* Capa e Categoria */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-neutral-800 text-sm uppercase tracking-wider border-b pb-2 border-neutral-100">
              Mídia e Publicação
            </h3>

            {/* Upload de Capa */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-700 block">Imagem de Capa *</span>
              
              {coverImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
                  <img 
                    src={coverImage} 
                    alt="Capa do post" 
                    className="w-full h-36 object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="bg-white/90 hover:bg-white text-neutral-800 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
                      Alterar Capa
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCoverUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl h-36 bg-neutral-50/50 hover:bg-neutral-50 cursor-pointer transition-colors">
                  {uploadingCover ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
                  ) : (
                    <>
                      <Image className="h-6 w-6 text-neutral-400" />
                      <span className="text-xs font-bold text-neutral-500 mt-2">Escolher imagem de capa</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleCoverUpload} 
                    className="hidden" 
                    required={!post}
                  />
                </label>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Categoria *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
              >
                <option value="agricultura">Agricultura</option>
                <option value="pecuaria">Pecuária</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Status de Publicação *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado (Visível no Blog)</option>
              </select>
            </div>
          </div>

          {/* Otimização de SEO */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-neutral-800 text-sm uppercase tracking-wider border-b pb-2 border-neutral-100 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-emerald-850" />
              Metatags SEO (Google)
            </h3>

            {/* SEO Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Título SEO (Máx 60 caracteres)</label>
              <input
                type="text"
                placeholder={title || "Deixe em branco para usar o título do post"}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
              />
            </div>

            {/* SEO Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Descrição SEO (Máx 160 caracteres)</label>
              <textarea
                rows={4}
                placeholder={summary || "Deixe em branco para usar o resumo do post"}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3 py-2 text-sm shadow-sm transition-colors"
              />
            </div>
          </div>

        </div>

      </div>

    </form>
  );
}
