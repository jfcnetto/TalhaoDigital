"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CommentItem {
  id: number;
  postId: number;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "pending" | "approved" | "spam" | "trash";
  createdAt: string;
  postTitle: string;
  postSlug: string;
}

interface CommentsModerationClientProps {
  initialComments: CommentItem[];
}

export default function CommentsModerationClient({ initialComments }: CommentsModerationClientProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filteredComments = comments.filter((c) => {
    if (activeTab === "all") return true;
    return c.status === activeTab;
  });

  const handleUpdateStatus = async (id: number, newStatus: "approved" | "spam" | "trash") => {
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(comments.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
      }
    } catch (err) {
      console.error("Erro ao atualizar status do comentário:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setComments(comments.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Erro ao excluir comentário:", err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Abas de Moderação WP Style */}
      <div className="flex items-center gap-2 border-b border-neutral-200 text-xs font-bold pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === "all" ? "bg-emerald-800 text-white shadow-2xs" : "text-neutral-600 hover:bg-neutral-200"}`}
        >
          Todos ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === "pending" ? "bg-emerald-800 text-white shadow-2xs" : "text-neutral-600 hover:bg-neutral-200"}`}
        >
          Pendente ({comments.filter((c) => c.status === "pending").length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === "approved" ? "bg-emerald-800 text-white shadow-2xs" : "text-neutral-600 hover:bg-neutral-200"}`}
        >
          Aprovados ({comments.filter((c) => c.status === "approved").length})
        </button>
        <button
          onClick={() => setActiveTab("spam")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === "spam" ? "bg-emerald-800 text-white shadow-2xs" : "text-neutral-600 hover:bg-neutral-200"}`}
        >
          Spam ({comments.filter((c) => c.status === "spam").length})
        </button>
      </div>

      {/* Lista de Comentários */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xs overflow-hidden divide-y divide-neutral-150">
        {filteredComments.length === 0 ? (
          <div className="text-center py-16 p-6 space-y-2">
            <MessageSquare className="h-8 w-8 text-neutral-300 mx-auto" />
            <p className="text-sm font-bold text-neutral-700">Nenhum comentário nesta categoria.</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className="p-6 space-y-3 hover:bg-neutral-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-neutral-100">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-sm text-neutral-900">{comment.authorName}</span>
                  <span className="text-xs text-neutral-400 block">{comment.authorEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    comment.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                    comment.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    {comment.status === "approved" ? "Aprovado" : comment.status === "pending" ? "Pendente" : "Spam"}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {new Date(comment.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              <div className="text-xs text-neutral-500 font-semibold">
                No artigo: <Link href={`/blog/${comment.postSlug}`} target="_blank" className="text-emerald-800 font-bold hover:underline">{comment.postTitle}</Link>
              </div>

              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 text-xs leading-relaxed">
                {comment.content}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {comment.status !== "approved" && (
                  <button
                    onClick={() => handleUpdateStatus(comment.id, "approved")}
                    disabled={loadingId === comment.id}
                    className="inline-flex items-center gap-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aprovar
                  </button>
                )}

                {comment.status !== "spam" && (
                  <button
                    onClick={() => handleUpdateStatus(comment.id, "spam")}
                    disabled={loadingId === comment.id}
                    className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Marcar Spam
                  </button>
                )}

                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={loadingId === comment.id}
                  className="inline-flex items-center gap-1 bg-neutral-100 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
