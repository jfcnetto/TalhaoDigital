import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldAlert, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Uso - Talhão Digital",
  description: "Termos e condições de uso da plataforma Talhão Digital SaaS de diagnósticos e laudos agronômicos.",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-12 lg:py-16">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 lg:p-12 shadow-sm space-y-8">
          
          <div className="border-b pb-6 border-neutral-150 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <FileText className="h-3.5 w-3.5" />
              Documento Legal
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              Termos e Condições de Uso
            </h1>
            <p className="text-neutral-500 text-xs sm:text-sm">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="space-y-6 text-sm text-neutral-600 leading-relaxed">
            
            <section className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e utilizar a plataforma <strong>Talhão Digital</strong>, você concorda expressamente em cumprir e estar vinculado aos presentes Termos e Condições de Uso. Caso não concorde com qualquer disposição aqui prevista, solicitamos que não utilize nossos serviços.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900">2. Descrição dos Serviços</h2>
              <p>
                O Talhão Digital é uma plataforma SaaS (Software como Serviço) que disponibiliza calculadoras agronômicas, simuladores de desconto de grãos, geradores de laudos em PDF e artigos técnicos especializados para auxiliar produtores rurais, engenheiros agrônomos e técnicos de campo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900">3. Responsabilidade pelos Cálculos e Laudos</h2>
              <p>
                As ferramentas e calculadoras fornecidas pela plataforma utilizam fórmulas agronômicas padrão e estimativas matemáticas. Os laudos gerados têm caráter de diagnóstico e orientação técnica. A tomada de decisão final no campo e a aplicação de insumos são de responsabilidade do profissional habilitado responsável técnico pela propriedade.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900">4. Planos, Assinaturas e Cancelamento</h2>
              <p>
                O acesso aos recursos Pro (emissão de laudos em PDF e impressão) é concedido mediante assinatura recorrente processada com segurança via Stripe. O usuário pode gerenciar ou cancelar a sua assinatura a qualquer momento através do seu painel administrativo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900">5. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo, marcas, logotipos, código-fonte e algoritmos do Talhão Digital são de propriedade exclusiva da plataforma e protegidos pelas leis de propriedade intelectual vigentes no Brasil.
              </p>
            </section>

            <section className="space-y-2 border-t pt-4 border-neutral-150">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-800" />
                Contato para Suporte Legal
              </h2>
              <p>
                Para dúvidas referentes a estes Termos de Uso, entre em contato com a nossa equipe através da página de contato do portal.
              </p>
            </section>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
