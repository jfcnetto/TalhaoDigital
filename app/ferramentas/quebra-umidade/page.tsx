import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import QuebraUmidadeClient from "./QuebraUmidadeClient";

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

export default async function QuebraUmidadePage() {
  const { userId } = auth();
  const user = await currentUser();
  let isPro = false;

  if (userId && user) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const isAdmin = user.publicMetadata?.role === 'admin' || dbUser?.role === 'admin';

    if (
      isAdmin || 
      dbUser?.isCourtesyPro || 
      sub?.status === 'active' || 
      sub?.status === 'trialing'
    ) {
      isPro = true;
    }
  }

  return <QuebraUmidadeClient isPro={isPro} />;
}
