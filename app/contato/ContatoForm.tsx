"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContatoForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Dúvida Técnica");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Envio assíncrono via AJAX com Hash Anônimo do FormSubmit
      const res = await fetch("https://formsubmit.co/ajax/071a45d45f47a4a2c97b054b840b916a", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          _subject: `[Talhão Digital] Novo Contato: ${subject}`,
          _template: "table",
          "👤 Nome do Solicitante": name,
          "✉️ E-mail de Contato": email,
          "📋 Categoria / Assunto": subject,
          "💬 Mensagem Enviada": message,
          "📅 Data do Envio": new Date().toLocaleString("pt-BR"),
          _captcha: "false"
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success !== "false") {
        setSuccess(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        // Se ainda precisar da ativação do FormSubmit no e-mail no primeiro teste
        if (data.message && data.message.includes("Activation")) {
          setError("Atenção: Acesse a sua caixa de entrada no Gmail (jfcnetto@gmail.com) e clique no link de ativação do FormSubmit para liberar os envios.");
        } else {
          throw new Error(data.message || "Erro ao enviar a mensagem.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Não foi possível enviar sua mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
      {success ? (
        <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-800" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-xl text-neutral-900">Mensagem Enviada com Sucesso! 🎉</h3>
            <p className="text-neutral-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Obrigado pelo seu contato. Nossa equipe técnica recebeu sua solicitação e responderá o mais breve possível.
            </p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            Enviar Outra Mensagem
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
              <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Seu Nome *</label>
              <input
                type="text"
                placeholder="Ex: Eng. João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3.5 py-2.5 text-sm shadow-sm transition-colors"
              />
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Seu E-mail *</label>
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3.5 py-2.5 text-sm shadow-sm transition-colors"
              />
            </div>
          </div>

          {/* Assunto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 block">Assunto *</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3.5 py-2.5 text-sm shadow-sm transition-colors"
            >
              <option value="Dúvida Técnica">Dúvida sobre Calculadoras / Laudos</option>
              <option value="Suporte de Assinatura">Suporte sobre Assinatura ou Stripe</option>
              <option value="Sugestão de Ferramenta">Sugestão de Nova Calculadora</option>
              <option value="Parceria / Comercial">Parcerias e Comercial</option>
              <option value="Outros">Outros Assuntos</option>
            </select>
          </div>

          {/* Mensagem */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 block">Sua Mensagem *</label>
            <textarea
              rows={5}
              placeholder="Descreva a sua solicitação com o máximo de detalhes..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full border border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl px-3.5 py-2.5 text-sm shadow-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-6 py-3.5 shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? "Enviando Mensagem..." : "Enviar Mensagem"}
          </button>
        </form>
      )}
    </div>
  );
}
