import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade - Talhão Digital",
  description: "Política de Privacidade e Proteção de Dados (LGPD) da plataforma Talhão Digital.",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-12 lg:py-16">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 lg:p-12 shadow-sm space-y-8">
          
          <div className="border-b pb-6 border-neutral-150 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <Lock className="h-3.5 w-3.5" />
              Proteção de Dados (LGPD)
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              Política de Privacidade
            </h1>
            <p className="text-neutral-500 text-xs sm:text-sm">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="space-y-6 text-sm text-neutral-600 leading-relaxed">
            
            <section className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900">1. Coleta de Informações</h2>
              <p>
                No Talhão Digital, respeitamos a privacidade dos nossos usuários. Coletamos informações pessoais essenciais para a prestação dos nossos serviços, tais como nome, e-mail e dados de identificação profissional (nome do responsável técnico e cliente), fornecidos voluntariamente durante o cadastro e geração de laudos.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900">2. Uso dos Dados</h2>
              <p>
                Os dados coletados são utilizados estritamente para:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                <li>Personalizar a emissão de laudos técnicos em PDF com os dados informados;</li>
                <li>Processar assinaturas e pagamentos com segurança via Stripe;</li>
                <li>Garantir a autenticação de acesso à plataforma via Clerk;</li>
                <li>Enviar avisos importantes sobre atualizações nas ferramentas e no sistema.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900">3. Segurança das Informações</h2>
              <p>
                Utilizamos criptografia SSL/TLS em todas as comunicações, banco de dados gerenciado em nuvem segura (Neon Postgres / AWS) e autenticação de dois fatores. Dados de cartão de crédito não são armazenados em nossos servidores, sendo processados diretamente pela infraestrutura certificada PCI-DSS do Stripe.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-neutral-900">4. Uso de Cookies</h2>
              <p>
                Utilizamos cookies estritamente necessários para manter a sua sessão ativa e salvar a sua preferência de consentimento de privacidade conforme exigido pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <section className="space-y-2 border-t pt-4 border-neutral-150">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-800" />
                Seus Direitos (LGPD)
              </h2>
              <p>
                Você tem o direito de solicitar o acesso, a correção ou a exclusão definitiva dos seus dados pessoais armazenados em nossa plataforma a qualquer momento entrando em contato com nosso Encarregado de Proteção de Dados.
              </p>
            </section>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
