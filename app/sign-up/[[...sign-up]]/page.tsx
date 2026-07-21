import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-neutral-50">
      {/* Lado Esquerdo - Painel de Branding Visual */}
      <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between bg-emerald-950 p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b_1px,transparent_1px),linear-gradient(to_bottom,#064e3b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
        
        {/* Cabeçalho Textual do Lado Esquerdo com Link para Home */}
        <div className="relative z-10">
          <Link href="/" className="inline-block hover:opacity-85 transition-opacity">
            <span className="text-2xl font-bold tracking-tight text-white">
              Talhão<span className="text-emerald-400">Digital</span>
            </span>
          </Link>
        </div>

        {/* Mensagem Principal Centralizada sem margem negativa (Usando padding para segurança) */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-md">
          <h1 className="text-3xl font-extrabold text-emerald-300 tracking-tight leading-tight">
            Comece a tomar decisões precisas hoje mesmo.
          </h1>
          <p className="text-emerald-100 text-base leading-relaxed opacity-90">
            Crie sua conta para testar gratuitamente as calculadoras de bicos de pulverização, rendimento operacional de tratores e conversores agrícolas.
          </p>
        </div>

        {/* Rodapé do Painel */}
        <div className="relative z-10 text-xs text-emerald-300">
          © 2026 Talhão Digital. Todos os direitos reservados.
        </div>
      </div>

      {/* Lado Direito - Componente de Cadastro */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Logo superior visível apenas no mobile com Link para Home */}
        <div className="lg:hidden flex items-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/logo.svg" alt="Talhão Digital" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full max-w-[400px]",
              card: "shadow-xl border border-neutral-200 rounded-2xl p-6 bg-white",
              headerTitle: "text-neutral-900 text-xl font-bold",
              headerSubtitle: "text-neutral-500 text-sm mt-1",
              socialButtonsBlockButton: "border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl py-2.5 transition-colors font-medium",
              formButtonPrimary: "bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl py-3 transition-colors text-sm font-semibold shadow-sm",
              formFieldInput: "border-neutral-200 focus:border-emerald-600 focus:ring-emerald-600 rounded-xl py-2.5 text-sm",
              footerActionLink: "text-emerald-850 hover:text-emerald-950 font-semibold transition-colors",
              formFieldLabel: "text-neutral-700 font-medium text-xs mb-1",
              identityPreviewText: "text-neutral-700 font-medium",
              identityPreviewEditButton: "text-emerald-800 hover:text-emerald-950",
              // Oculta o badge de "Last used" que insiste em aparecer em inglês
              badge: "hidden",
            },
            layout: {
              socialButtonsPlacement: "bottom",
            }
          }}
        />
      </div>
    </div>
  );
}
