import Link from "next/link";
import { ArrowRight, Calculator, BarChart3, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-900 selection:bg-emerald-200">
      {/* Header Unificado */}
      <Header />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 text-center">
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl max-w-3xl mx-auto leading-tight">
              Decisões agrícolas precisas, direto no <span className="text-emerald-800">campo</span>.
            </h1>
            <p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
              Substitua planilhas complexas por calculadoras ágeis e sempre disponíveis. Feito para agrônomos, técnicos e produtores que buscam produtividade e economia de insumos.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/ferramentas/quebra-umidade"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-900 hover:shadow-xl transition-all duration-200"
              >
                Ver Calculadoras
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#planos"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-base font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Conhecer Planos Pro
              </Link>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-16 bg-white border-y border-neutral-200">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex gap-4 p-6 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl h-fit">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900">19 Ferramentas Prontas</h3>
                  <p className="mt-2 text-sm text-neutral-600">De calagem e NPK a manejo de pastagem, silagem e conversão de coordenadas GPS.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl h-fit">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900">Memória de Cálculo</h3>
                  <p className="mt-2 text-sm text-neutral-600">Transparência total. Visualize a fórmula agronômica utilizada direto nos resultados.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl h-fit">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900">Relatórios em PDF</h3>
                  <p className="mt-2 text-sm text-neutral-600">Gere laudos profissionais com dados do cliente e CREA direto do celular para envio.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé Unificado */}
      <Footer />
    </div>
  );
}
