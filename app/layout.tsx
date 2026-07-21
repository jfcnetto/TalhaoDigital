import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";

import CookieBanner from "@/components/CookieBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Talhão Digital - Calculadoras Agropecuárias de Alta Precisão",
  description: "SaaS de calculadoras agropecuárias para agrônomos, técnicos, produtores e pecuaristas no Brasil.",
  metadataBase: new URL("https://talhaodigital.com.br"),
  icons: {
    icon: "/favicon.svg",
  },
};

// Customização aninhada correta do dicionário ptBR do Clerk
const ptBRCustom = {
  ...ptBR,
  signIn: {
    ...ptBR.signIn,
    start: {
      ...ptBR.signIn?.start,
      label__lastUsed: "Último usado",
      label__last_used: "Último usado",
    }
  },
  signUp: {
    ...ptBR.signUp,
    start: {
      ...ptBR.signUp?.start,
      label__lastUsed: "Último usado",
      label__last_used: "Último usado",
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBRCustom}>
      <html lang="pt-BR">
        <body className={`${inter.className} min-h-screen flex flex-col`}>
          {children}
          <CookieBanner />
        </body>
      </html>
    </ClerkProvider>
  );
}
