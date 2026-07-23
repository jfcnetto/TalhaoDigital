import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-emerald-50 text-neutral-600 py-12 border-t border-emerald-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          {/* Logo verde original sem classe invert para fundo claro */}
          <img src="/logo.svg" alt="Talhão Digital" className="h-8 w-auto opacity-90" />
          <span className="text-xs text-neutral-500">© 2026. Todos os direitos reservados.</span>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-emerald-800 transition-colors">Início</Link>
          <Link href="/contato" className="hover:text-emerald-800 transition-colors">Contato</Link>
          <Link href="/ajuda" className="hover:text-emerald-800 transition-colors">Ajuda</Link>
          <Link href="/termos" className="hover:text-emerald-800 transition-colors">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-emerald-800 transition-colors">Privacidade</Link>
        </div>
      </div>
    </footer>
  );
}
