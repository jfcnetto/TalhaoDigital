"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Comment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

interface BlogCommentsProps {
  postId: number;
}

export default function BlogComments({ postId }: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/comments?postId=${postId}`);
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error("Erro ao carregar comentários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName,
          authorEmail,
          content,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || "Comentário enviado para aprovação!");
        setAuthorName("");
        setAuthorEmail("");
        setContent("");
      } else {
        setErrorMsg(data.error || "Erro ao enviar comentário.");
      }
    } catch (err: any) {
      setErrorMsg("Erro de conexão ao enviar comentário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pt-8 border-t border-neutral-200">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-emerald-800" />
        <h3 className="font-extrabold text-xl text-neutral-900">
          Comentários ({comments.length})
        </h3>
      </div>

      {/* Formulário de Novo Comentário */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-4">
        <h4 className="font-bold text-sm text-neutral-850">Deixe sua dúvida ou contribuição técnica</h4>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-center gap-3 text-xs">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Seu Nome *"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              className="w-full border border-neutral-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs bg-white shadow-2xs"
            />
            <input
              type="email"
              placeholder="Seu E-mail (não será publicado) *"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              required
              className="w-full border border-neutral-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs bg-white shadow-2xs"
            />
          </div>

          <textarea
            rows={3}
            placeholder="Escreva sua dúvida ou comentário..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="w-full border border-neutral-200 focus:border-emerald-600 rounded-xl p-3.5 text-xs bg-white shadow-2xs"
          />

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2.5 shadow-md transition-all cursor-pointer disabled:opacity-70"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {submitting ? "Enviando..." : "Publicar Comentário"}
          </button>
        </form>
      </div>

      {/* Lista de Comentários Aprovados */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-6 text-center text-xs text-neutral-400">Carregando comentários...</div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-neutral-500 italic">Seja o primeiro a comentar neste artigo!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-4 bg-white border border-neutral-200 rounded-2xl space-y-2 shadow-2xs">
              <div className="flex justify-between items-center text-xs border-b pb-2 border-neutral-100">
                <span className="font-extrabold text-neutral-900">{c.authorName}</span>
                <span className="text-neutral-400 text-[11px]">
                  {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
