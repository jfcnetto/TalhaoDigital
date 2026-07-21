"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import { 
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, 
  Quote, Link as LinkIcon, Image as ImageIcon, Sparkles, Eye, 
  Save, Globe, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Tag, Code
} from "lucide-react";
import MediaLibraryModal from "./MediaLibraryModal";

interface Category {
  id: number;
  name: string;
  slug: string;
  area: string;
}

interface TagItem {
  id: number;
  name: string;
  slug: string;
}

interface WpBlogEditorProps {
  initialPost?: any;
  categories: Category[];
  tags: TagItem[];
}

export default function WpBlogEditor({ initialPost, categories, tags }: WpBlogEditorProps) {
  const router = useRouter();

  const [id, setId] = useState<number | null>(initialPost?.id || null);
  const [title, setTitle] = useState(initialPost?.title || "");
  const [slug, setSlug] = useState(initialPost?.slug || "");
  const [summary, setSummary] = useState(initialPost?.summary || "");
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || "");
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialPost?.seoDescription || "");
  const [focusKeyword, setFocusKeyword] = useState(initialPost?.focusKeyword || "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialPost?.canonicalUrl || "");
  const [category, setCategory] = useState(initialPost?.category || "agricultura");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled" | "trash">(initialPost?.status || "draft");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialPost?.tagIds || []);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<"cover" | "editor">("cover");

  // Modo de Edição: 'visual' (Tiptap) ou 'html' (Código HTML Direto 100% Preservado)
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const [rawHtml, setRawHtml] = useState<string>(initialPost?.contentHtml || "");

  // Tiptap Editor Core
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({ allowBase64: true }),
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: initialPost?.contentHtml || "<p>Comece a escrever o conteúdo técnico do artigo aqui...</p>",
    onUpdate: ({ editor }) => {
      setRawHtml(editor.getHTML());
    },
  });

  // Atualizar rawHtml sempre que o editor visual for modificado
  useEffect(() => {
    if (editor && editorMode === "visual") {
      setRawHtml(editor.getHTML());
    }
  }, [editor, editorMode]);

  // Sincronizar título -> slug automaticamente para novos artigos
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!initialPost) {
      const generatedSlug = newTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
    }
  };

  // Funções dos Botões da Toolbar
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleH1 = () => editor?.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleH2 = () => editor?.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleH3 = () => editor?.chain().focus().toggleHeading({ level: 3 }).run();
  const toggleH4 = () => editor?.chain().focus().toggleHeading({ level: 4 }).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();

  // Cálculo de leitura (Seção C)
  const textContent = editorMode === "html" ? rawHtml.replace(/<[^>]*>?/gm, '') : (editor?.getText() || "");
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  // Inserir Bloco Customizado de CTA no Editor (Seção C)
  const insertCtaBlock = () => {
    const ctaHtml = `
      <div class="my-6 p-6 rounded-2xl bg-emerald-950 text-white border border-emerald-800 text-center space-y-3">
        <h4 class="text-lg font-bold text-white">🌱 Gostou desse conteúdo técnico?</h4>
        <p class="text-xs text-emerald-200">Faça seus cálculos agronômicos em segundos e emita laudos completos em PDF com a sua marca.</p>
        <a href="/ferramentas/quebra-umidade" class="inline-block bg-white text-emerald-950 font-extrabold text-xs px-4 py-2 rounded-xl">Experimentar Calculadora ➔</a>
      </div>
    `;
    if (editorMode === "html") {
      setRawHtml((prev) => prev + "\n" + ctaHtml);
    } else if (editor) {
      editor.chain().focus().insertContent(ctaHtml).run();
    }
  };

  // Callback de Seleção de Mídia R2
  const handleSelectMedia = (url: string, altText: string) => {
    if (mediaTarget === "cover") {
      setCoverImage(url);
    } else if (mediaTarget === "editor") {
      if (editorMode === "html") {
        setRawHtml((prev) => prev + `\n<img src="${url}" alt="${altText}" />`);
      } else if (editor) {
        editor.chain().focus().setImage({ src: url, alt: altText }).run();
      }
    }
  };

  // Salvar Post (RN-010 Validação Obrigatória)
  const handleSave = async (targetStatus?: "draft" | "published") => {
    const finalStatus = targetStatus || status;

    // Se for publicar, validar metadados de SEO obrigatórios (RN-010)
    if (finalStatus === "published") {
      if (!title || !slug || !summary || !coverImage || !seoTitle || !seoDescription) {
        setErrorMessage("Erro RN-010: Para publicar o post, é obrigatório preencher Título, Slug, Resumo, Imagem de Capa, Title Tag e Meta Description.");
        return;
      }
    }

    setSaving(true);
    setErrorMessage(null);

    // Se editado no modo HTML, salva o rawHtml 100% íntegro sem passar por filtros
    const finalHtml = editorMode === "html" ? rawHtml : (editor?.getHTML() || rawHtml);

    const payload = {
      id,
      title,
      slug,
      summary,
      contentHtml: finalHtml,
      contentJson: editor?.getJSON() || {},
      coverImage,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || summary,
      focusKeyword,
      canonicalUrl,
      category,
      status: finalStatus,
      tagIds: selectedTagIds,
    };

    try {
      const res = await fetch("/api/admin/blog", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.post) {
        setId(data.post.id);
        setStatus(data.post.status);
        router.push("/admin/blog");
      } else {
        setErrorMessage(data.error || "Erro ao salvar postagem.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro de conexão ao salvar post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Topo / Navigation */}
      <div className="flex items-center justify-between border-b pb-4 border-neutral-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-600 transition-colors"
            title="Voltar para Posts"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-neutral-900">
              {id ? "Editar Artigo" : "Adicionar Novo Artigo"}
            </h1>
            <span className="text-xs text-neutral-500">
              {wordCount} palavras • {readingTime} min de leitura estimada
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {slug && (
            <a
              href={`/blog/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors"
            >
              <Eye className="h-4 w-4" />
              Visualizar
            </a>
          )}

          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors shadow-xs"
          >
            <Save className="h-4 w-4" />
            Salvar Rascunho
          </button>

          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            {status === "published" ? "Atualizar Post" : "Publicar Agora"}
          </button>
        </div>
      </div>

      {/* Alertas de Erro */}
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
          <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid Principal (8 cols Coluna Esquerda | 4 cols Coluna Direita WP Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: Título, Permalink, Editor Tiptap e SEO Box (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Título & Permalink */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider block">Título do Artigo *</label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Ex: Tarifaço Americano: Entenda o Impacto das Sobretaxas dos EUA"
                className="w-full text-xl font-extrabold text-neutral-900 border border-neutral-200 focus:border-emerald-600 rounded-xl px-4 py-3 shadow-2xs"
              />
            </div>

            {/* Editor de Permalink/Slug */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <span className="font-bold text-neutral-700">Link Permanente:</span>
              <span className="text-neutral-400">https://talhaodigital.com.br/blog/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-white border border-neutral-200 focus:border-emerald-600 rounded px-2 py-1 text-xs font-semibold text-neutral-850"
              />
            </div>
          </div>

          {/* Resumo/Excerpt */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-2">
            <label className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider block">Resumo do Artigo (Excerpt) *</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Escreva um breve resumo atraente do artigo que aparecerá nos cards do blog..."
              className="w-full text-xs text-neutral-700 border border-neutral-200 focus:border-emerald-600 rounded-xl p-3 shadow-2xs"
            />
          </div>

          {/* CONTAINER DO EDITOR (MODO VISUAL & MODO CÓDIGO HTML) */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
            
            {/* Header com Alternador de Modo: Visual vs Código HTML */}
            <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-neutral-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    if (editorMode === "html" && editor && rawHtml) {
                      try {
                        editor.commands.setContent(rawHtml);
                      } catch (e) {}
                    }
                    setEditorMode("visual");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    editorMode === "visual" ? "bg-white text-emerald-850 shadow-2xs" : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  👁️ Editor Visual
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (editorMode === "visual" && editor) {
                      setRawHtml(editor.getHTML());
                    }
                    setEditorMode("html");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    editorMode === "html" ? "bg-white text-emerald-850 shadow-2xs" : "text-neutral-700"
                  }`}
                >
                  &lt;/&gt; Código HTML Completo
                </button>
              </div>

              <span className="text-[11px] text-neutral-500 font-bold hidden sm:inline">
                {editorMode === "visual" ? "Modo de Edição Visual" : "Modo de Inserção Direta de Código HTML"}
              </span>
            </div>

            {/* MODO 1: EDITOR VISUAL (TIPTAP) */}
            {editorMode === "visual" && (
              <>
                {/* Toolbar do Editor Visual com Botões Funcionais */}
                <div className="bg-neutral-50 border-b border-neutral-200 p-2 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleBold}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors ${editor?.isActive("bold") ? "bg-white shadow text-emerald-800" : "text-neutral-600 hover:bg-neutral-200"}`}
                    title="Negrito"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleItalic}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors ${editor?.isActive("italic") ? "bg-white shadow text-emerald-800" : "text-neutral-600 hover:bg-neutral-200"}`}
                    title="Itálico"
                  >
                    <Italic className="h-4 w-4" />
                  </button>

                  <div className="h-4 w-px bg-neutral-300 mx-1" />

                  <button
                    type="button"
                    onClick={toggleH1}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors ${editor?.isActive("heading", { level: 1 }) ? "bg-white shadow text-emerald-800" : "text-neutral-600 hover:bg-neutral-200"}`}
                    title="Título H1"
                  >
                    H1
                  </button>

                  <button
                    type="button"
                    onClick={toggleH2}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors ${editor?.isActive("heading", { level: 2 }) ? "bg-white shadow text-emerald-800" : "text-neutral-600 hover:bg-neutral-200"}`}
                    title="Título H2"
                  >
                    H2
                  </button>

                  <button
                    type="button"
                    onClick={toggleH3}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors ${editor?.isActive("heading", { level: 3 }) ? "bg-white shadow text-emerald-800" : "text-neutral-600 hover:bg-neutral-200"}`}
                    title="Título H3"
                  >
                    H3
                  </button>

                  <button
                    type="button"
                    onClick={toggleH4}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors ${editor?.isActive("heading", { level: 4 }) ? "bg-white shadow text-emerald-800" : "text-neutral-600 hover:bg-neutral-200"}`}
                    title="Título H4"
                  >
                    H4
                  </button>

                  <div className="h-4 w-px bg-neutral-300 mx-1" />

                  <button
                    type="button"
                    onClick={toggleBulletList}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors ${editor?.isActive("bulletList") ? "bg-white shadow text-emerald-800" : "text-neutral-600 hover:bg-neutral-200"}`}
                    title="Lista de Marcadores"
                  >
                    <List className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={toggleOrderedList}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors ${editor?.isActive("orderedList") ? "bg-white shadow text-emerald-800" : "text-neutral-600 hover:bg-neutral-200"}`}
                    title="Lista Numerada"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={toggleBlockquote}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors ${editor?.isActive("blockquote") ? "bg-white shadow text-emerald-800" : "text-neutral-600 hover:bg-neutral-200"}`}
                    title="Citação"
                  >
                    <Quote className="h-4 w-4" />
                  </button>

                  <div className="h-4 w-px bg-neutral-300 mx-1" />
                  
                  {/* Botão de Inserir Imagem */}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaTarget("editor");
                      setMediaModalOpen(true);
                    }}
                    className="p-2 rounded-lg text-xs font-bold text-neutral-600 hover:bg-neutral-200 flex items-center gap-1"
                    title="Inserir Imagem"
                  >
                    <ImageIcon className="h-4 w-4 text-emerald-800" />
                    <span>Imagens</span>
                  </button>

                  {/* Botão Customizado de Embed de CTA (Seção C) */}
                  <button
                    type="button"
                    onClick={insertCtaBlock}
                    className="p-2 rounded-lg text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 flex items-center gap-1 ml-auto shadow-2xs cursor-pointer"
                    title="Inserir Chamada para Calculadora"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Inserir CTA Calculadora</span>
                  </button>
                </div>

                {/* Área Editável do Tiptap */}
                <div className="p-6 min-h-[350px] text-neutral-800 leading-relaxed text-sm prose max-w-none">
                  <EditorContent editor={editor} />
                </div>
              </>
            )}

            {/* MODO 2: EDITOR CÓDIGO HTML DIRETO (100% PRESERVADO E RENDERIZADO) */}
            {editorMode === "html" && (
              <div className="p-6 space-y-6 bg-neutral-900 text-emerald-400">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-300 font-bold border-b border-neutral-800 pb-2">
                    <span>Cole seu código HTML completo abaixo:</span>
                    <span className="text-emerald-400 text-[11px]">100% de preservação de tags (article, section, header, h1, etc.)</span>
                  </div>

                  <textarea
                    rows={18}
                    value={rawHtml}
                    onChange={(e) => setRawHtml(e.target.value)}
                    placeholder="Cole seu código HTML completo aqui..."
                    className="w-full bg-neutral-950 text-neutral-100 border border-neutral-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500 font-mono text-xs leading-relaxed shadow-inner"
                  />
                </div>

                {/* PRÉ-VISUALIZAÇÃO EM TEMPO REAL DO HTML RENDERIZADO */}
                <div className="space-y-2 bg-white text-neutral-900 rounded-2xl p-6 border border-neutral-300 shadow-md">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 border-b pb-2 block">
                    👁️ Pré-visualização do Artigo HTML Renderizado:
                  </span>
                  <div 
                    className="prose prose-emerald max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: rawHtml || "<p class='text-neutral-400 italic'>O resultado renderizado do seu código HTML aparecerá aqui...</p>" }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* CAIXA SEO GOOGLE (Obrigatória RN-010 - Seção E) */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b pb-3 border-neutral-150">
              <Globe className="h-5 w-5 text-emerald-800" />
              <h3 className="font-extrabold text-base text-neutral-900">Otimização para Busca (Google SEO - RN-010)</h3>
            </div>

            {/* Snippet Preview do Google */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Pré-visualização do Resultado no Google</span>
              <div className="text-blue-800 font-semibold text-base truncate hover:underline cursor-pointer">
                {seoTitle || title || "Título SEO do Artigo - Talhão Digital"}
              </div>
              <div className="text-emerald-800 text-xs truncate">
                https://talhaodigital.com.br/blog/{slug || "exemplo-slug"}
              </div>
              <div className="text-neutral-600 text-xs line-clamp-2">
                {seoDescription || summary || "Sua meta descrição formatada aparecerá exatamente aqui para os usuários no Google..."}
              </div>
            </div>

            {/* Inputs SEO */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-neutral-700">Título SEO (Title Tag) *</label>
                  <span className={`text-[10px] ${seoTitle.length > 60 ? "text-red-500 font-bold" : "text-neutral-400"}`}>
                    {seoTitle.length} / 60 caracteres recomendados
                  </span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Título otimizado para o Google"
                  className="w-full border border-neutral-200 focus:border-emerald-600 rounded-xl p-2.5 text-xs shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-neutral-700">Meta Descrição *</label>
                  <span className={`text-[10px] ${seoDescription.length > 160 ? "text-red-500 font-bold" : "text-neutral-400"}`}>
                    {seoDescription.length} / 160 caracteres recomendados
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Resumo atraente com palavra-chave para aumentar o clique no Google"
                  className="w-full border border-neutral-200 focus:border-emerald-600 rounded-xl p-2.5 text-xs shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Palavra-Chave Foco</label>
                  <input
                    type="text"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    placeholder="Ex: tarifaço americano"
                    className="w-full border border-neutral-200 focus:border-emerald-600 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">URL Canônica (Opcional)</label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-neutral-200 focus:border-emerald-600 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: WORDPRESS SIDEBAR (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Caixa Publicar WP */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="font-extrabold text-sm text-neutral-900 border-b pb-2">Status & Publicação</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-bold">Estado do Post:</span>
                <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                  status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {status === "published" ? "Publicado" : "Rascunho"}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-500">
                <span>Visibilidade:</span>
                <span className="font-bold text-neutral-800">Público (100% Livre)</span>
              </div>
            </div>

            <div className="pt-3 border-t flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSave("published")}
                disabled={saving}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs py-2.5 rounded-xl shadow transition-colors cursor-pointer"
              >
                {status === "published" ? "Atualizar Postagem" : "Publicar Agora"}
              </button>
            </div>
          </div>

          {/* WIDGET DINÂMICO DE PONTUAÇÃO & DICAS DE SEO (Estilo RankMath / Yoast) */}
          {(() => {
            const kw = focusKeyword.trim().toLowerCase();
            const lowerTitle = title.toLowerCase();
            const lowerSlug = slug.toLowerCase();
            const lowerDesc = seoDescription.toLowerCase();

            let score = 0;
            const checks: { label: string; tip: string; ok: boolean; points: number }[] = [];

            const hasKw = kw.length > 0;
            checks.push({
              label: "Palavra-chave foco definida",
              tip: "Defina a palavra-chave principal na caixa de SEO.",
              ok: hasKw,
              points: 15,
            });

            const kwInTitle = hasKw && lowerTitle.includes(kw);
            checks.push({
              label: "Palavra-chave no Título",
              tip: "Inclua a palavra-chave foco no título do artigo.",
              ok: kwInTitle,
              points: 15,
            });

            const kwInSlug = hasKw && lowerSlug.includes(kw.replace(/\s+/g, "-"));
            checks.push({
              label: "Palavra-chave no Slug da URL",
              tip: "A palavra-chave foco deve aparecer na URL do post.",
              ok: kwInSlug,
              points: 15,
            });

            const kwInDesc = hasKw && lowerDesc.includes(kw);
            checks.push({
              label: "Palavra-chave na Meta Descrição",
              tip: "Adicione a palavra-chave foco na descrição de busca.",
              ok: kwInDesc,
              points: 15,
            });

            const titleLenOk = seoTitle.length >= 30 && seoTitle.length <= 60;
            checks.push({
              label: "Tamanho do Título SEO (30-60 caracteres)",
              tip: "O título SEO ideal deve ter entre 30 e 60 caracteres.",
              ok: titleLenOk,
              points: 10,
            });

            const descLenOk = seoDescription.length >= 120 && seoDescription.length <= 160;
            checks.push({
              label: "Tamanho da Meta Descrição (120-160 caracteres)",
              tip: "A meta descrição ideal deve ter entre 120 e 160 caracteres.",
              ok: descLenOk,
              points: 10,
            });

            const wordsOk = wordCount >= 300;
            checks.push({
              label: "Tamanho do Texto (> 300 palavras)",
              tip: "Escreva ao menos 300 palavras para um bom posicionamento no Google.",
              ok: wordsOk,
              points: 10,
            });

            const coverOk = coverImage.length > 0;
            checks.push({
              label: "Imagem de Destaque / Capa",
              tip: "Defina uma imagem de capa para o Open Graph das redes sociais.",
              ok: coverOk,
              points: 10,
            });

            score = checks.reduce((acc, curr) => acc + (curr.ok ? curr.points : 0), 0);

            let scoreBg = "bg-red-500";
            let scoreText = "text-red-700";
            let scoreLabel = "Melhoria Necessária 🔴";
            if (score >= 80) {
              scoreBg = "bg-emerald-500";
              scoreText = "text-emerald-700";
              scoreLabel = "Excelente 🟢";
            } else if (score >= 50) {
              scoreBg = "bg-amber-500";
              scoreText = "text-amber-700";
              scoreLabel = "Bom 🟡";
            }

            return (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-neutral-150">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-800" />
                    <h4 className="font-extrabold text-sm text-neutral-900">Análise de SEO em Tempo Real</h4>
                  </div>
                  <span className={`text-[11px] font-extrabold ${scoreText}`}>{scoreLabel}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-600">Pontuação de SEO:</span>
                    <span className="font-extrabold text-base text-neutral-900">{score} / 100 pts</span>
                  </div>
                  <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                    <div
                      className={`h-full ${scoreBg} transition-all duration-500`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-150 text-xs">
                  <span className="font-bold text-neutral-700 text-[11px] uppercase tracking-wider block">Dicas de Otimização:</span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {checks.map((chk, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11.5px] leading-snug">
                        {chk.ok ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className={`font-bold block ${chk.ok ? "text-neutral-800" : "text-neutral-900"}`}>
                            {chk.label}
                          </span>
                          {!chk.ok && (
                            <span className="text-[10.5px] text-amber-700 block mt-0.5">
                              💡 {chk.tip}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Caixa Categorias WP */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="font-extrabold text-sm text-neutral-900 border-b pb-2">Categoria Agronômica</h4>
            <div className="space-y-2 text-xs">
              {[
                { id: "agricultura", label: "🌾 Agricultura" },
                { id: "pecuaria", label: "🐄 Pecuária" },
                { id: "financeiro", label: "📊 Financeiro & Gestão" },
              ].map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-700">
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={category === cat.id}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-emerald-800 focus:ring-emerald-600"
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Caixa Imagem de Destaque WP (Seção D - Cloudflare R2) */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="font-extrabold text-sm text-neutral-900 border-b pb-2">Imagem de Destaque (Capa) *</h4>
            
            {coverImage ? (
              <div className="space-y-2">
                <div className="aspect-video rounded-xl border overflow-hidden bg-neutral-100">
                  <img src={coverImage} alt="Capa" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Remover Imagem de Destaque
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMediaTarget("cover");
                  setMediaModalOpen(true);
                }}
                className="w-full border-2 border-dashed border-neutral-300 hover:border-emerald-600 rounded-xl p-6 text-center space-y-2 transition-colors cursor-pointer"
              >
                <ImageIcon className="h-8 w-8 text-neutral-400 mx-auto" />
                <span className="text-xs text-emerald-800 font-extrabold block">Definir Imagem de Destaque</span>
                <span className="text-[10px] text-neutral-400 block">Usada no Open Graph e redes sociais</span>
              </button>
            )}
          </div>

          {/* Caixa Tags WP */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-neutral-900 flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-emerald-800" />
                Tags do Post
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => {
                const isSelected = selectedTagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTagIds(selectedTagIds.filter((id) => id !== t.id));
                      } else {
                        setSelectedTagIds([...selectedTagIds, t.id]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected ? "bg-emerald-800 text-white shadow-2xs" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Modal da Biblioteca de Mídia */}
      <MediaLibraryModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelectMedia={handleSelectMedia}
      />
    </div>
  );
}
