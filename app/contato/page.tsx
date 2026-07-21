import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContatoForm from "./ContatoForm";
import { Mail, PhoneCall, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contato - Talhão Digital",
  description: "Fale com a equipe do Talhão Digital. Dúvidas técnicas, suporte sobre laudos e sugestões de ferramentas.",
};

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-12 lg:py-16">
        <div className="space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <Mail className="h-3.5 w-3.5" />
              Atendimento & Suporte
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              Fale com a Nossa <span className="text-emerald-800">Equipe</span>
            </h1>
            <p className="text-neutral-500 text-sm sm:text-base leading-relaxed">
              Tem alguma dúvida sobre a emissão de laudos, planos ou deseja sugerir uma nova calculadora agronômica? Envie sua mensagem!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Coluna Informações de Contato (4 cols) */}
            <div className="lg:col-span-4 bg-emerald-950 text-white rounded-3xl p-8 space-y-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900 rounded-full blur-2xl opacity-40 -mr-8 -mt-8" />

              <div className="space-y-2 relative z-10">
                <h3 className="font-extrabold text-xl text-white">Canais Oficiais</h3>
                <p className="text-emerald-300 text-xs leading-relaxed">
                  Estamos prontos para atender engenheiros agrônomos, técnicos e produtores rurais.
                </p>
              </div>

              <div className="space-y-6 text-xs text-emerald-100 relative z-10">
                <div className="flex gap-3 items-center">
                  <div className="p-2.5 bg-emerald-900 rounded-xl text-emerald-300">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-emerald-400 block text-[10px] uppercase font-bold">E-mail de Suporte</span>
                    <span className="font-bold text-sm text-white">suporte@talhaodigital.com.br</span>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="p-2.5 bg-emerald-900 rounded-xl text-emerald-300">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-emerald-400 block text-[10px] uppercase font-bold">Horário de Atendimento</span>
                    <span className="font-bold text-sm text-white">Seg. a Sex. das 08h às 18h</span>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="p-2.5 bg-emerald-900 rounded-xl text-emerald-300">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-emerald-400 block text-[10px] uppercase font-bold">Origem</span>
                    <span className="font-bold text-sm text-white">Brasil - Tecnologia para o Agro</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-900/80 text-[11px] text-emerald-300/80 relative z-10">
                ⚡ Resposta rápida em até 24 horas úteis.
              </div>
            </div>

            {/* Formulario Cliente Assíncrono sem Redirecionamento FormSubmit (8 cols) */}
            <div className="lg:col-span-8">
              <ContatoForm />
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
