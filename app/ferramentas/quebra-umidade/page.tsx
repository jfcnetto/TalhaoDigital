import type { Metadata } from "next";
import QuebraUmidadeClient from "./QuebraUmidadeClient";

// Otimização completa de metatags SEO para indexação no Google (H1, H2 e metatags estruturadas)
export const metadata: Metadata = {
  title: "Simulador de Quebra de Umidade de Grãos (Desconto) - Talhão Digital",
  description: "Calcule grátis o desconto em peso e financeiro de cargas de grãos (soja, milho, etc.) devido a umidade e impurezas. Ajustado para o padrão de armazenagem brasileiro.",
  keywords: [
    "quebra de umidade",
    "desconto de armazenagem",
    "secagem de graos",
    "desconto de impurezas",
    "calculadora agricola",
    "soja",
    "milho",
    "peso liquido graos",
    "agricultura de precisao",
    "talhao digital"
  ],
  openGraph: {
    title: "Simulador de Quebra de Umidade de Grãos - Talhão Digital",
    description: "Evite prejuízos na cooperativa. Calcule a quebra de umidade e impureza de grãos instantaneamente.",
    url: "https://talhaodigital.com.br/ferramentas/quebra-umidade",
    type: "website",
    locale: "pt_BR",
  },
  alternates: {
    canonical: "https://talhaodigital.com.br/ferramentas/quebra-umidade",
  }
};

export default function QuebraUmidadePage() {
  return <QuebraUmidadeClient />;
}
