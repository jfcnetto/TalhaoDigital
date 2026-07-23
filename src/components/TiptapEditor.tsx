"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Link2, Image as ImageIcon, Undo, Redo, Code, Loader2 } from "lucide-react";
import { useState } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string, json: any) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-emerald-800 underline font-semibold hover:text-emerald-950 transition-colors",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-xl border border-neutral-200 shadow-md my-6 max-h-[400px] object-cover mx-auto",
        },
      }),
    ],
    content: content || "<p>Comece a escrever seu artigo aqui...</p>",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getJSON());
    },
  });

  if (!editor) return null;

  // Handler para Upload de Imagem inline para Cloudflare R2
  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          editor.chain().focus().setImage({ src: data.url }).run();
        } else {
          alert("Falha no upload da imagem.");
        }
      } catch (error) {
        console.error("Erro no upload:", error);
        alert("Erro de conexão ao enviar imagem.");
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  // Handler para inserir Link
  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Insira a URL do link:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border border-neutral-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600 focus-within:border-emerald-600 transition-shadow">
      
      {/* Barra de Ferramentas do Editor (Toolbar) */}
      <div className="bg-neutral-50 border-b border-neutral-250 p-2.5 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg hover:bg-neutral-200 transition-colors ${editor.isActive("bold") ? "bg-neutral-200 text-emerald-800" : "text-neutral-600"}`}
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg hover:bg-neutral-200 transition-colors ${editor.isActive("italic") ? "bg-neutral-200 text-emerald-800" : "text-neutral-600"}`}
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </button>

        <span className="w-px h-5 bg-neutral-250 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg hover:bg-neutral-200 transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-neutral-200 text-emerald-800" : "text-neutral-600"}`}
          title="Título H2"
        >
          <Heading1 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg hover:bg-neutral-200 transition-colors ${editor.isActive("heading", { level: 3 }) ? "bg-neutral-200 text-emerald-800" : "text-neutral-600"}`}
          title="Título H3"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <span className="w-px h-5 bg-neutral-250 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg hover:bg-neutral-200 transition-colors ${editor.isActive("bulletList") ? "bg-neutral-200 text-emerald-800" : "text-neutral-600"}`}
          title="Lista"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg hover:bg-neutral-200 transition-colors ${editor.isActive("orderedList") ? "bg-neutral-200 text-emerald-800" : "text-neutral-600"}`}
          title="Lista Numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <span className="w-px h-5 bg-neutral-250 mx-1" />

        <button
          type="button"
          onClick={handleSetLink}
          className={`p-1.5 rounded-lg hover:bg-neutral-200 transition-colors ${editor.isActive("link") ? "bg-neutral-200 text-emerald-800" : "text-neutral-600"}`}
          title="Inserir Link"
        >
          <Link2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleImageUpload}
          disabled={uploading}
          className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-600 transition-colors disabled:opacity-50"
          title="Inserir Imagem do R2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-850" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </button>

        <span className="w-px h-5 bg-neutral-250 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-650 transition-colors"
          title="Desfazer"
        >
          <Undo className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-650 transition-colors"
          title="Refazer"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="p-4 bg-white min-h-[300px] prose prose-sm max-w-none focus:outline-none select-text">
        <EditorContent editor={editor} className="outline-none min-h-[300px]" />
      </div>
    </div>
  );
}
