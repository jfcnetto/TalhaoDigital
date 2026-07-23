import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import CalagemGessagemClient from "./CalagemGessagemClient";

export const metadata: Metadata = {
  title: "Calculadora de Calagem e Gessagem (Saturação por Bases) - Talhão Digital",
  description: "Calcule a necessidade de calcário e gesso agrícola (NC e NG) online e offline. Método da Saturação por Bases (V%).",
  keywords: [
    "calculadora calagem",
    "calculadora gessagem",
    "necessidade de calcário",
    "saturação por bases",
    "V%",
    "prnt",
    "agronomia",
    "talhao digital"
  ],
  openGraph: {
    title: "Calculadora de Calagem e Gessagem - Talhão Digital",
    description: "Emita laudos de recomendação de calcário e gesso com base na análise de solo.",
    url: "https://talhaodigital.com.br/ferramentas/calagem-gessagem",
    type: "website",
    locale: "pt_BR",
  },
  alternates: {
    canonical: "https://talhaodigital.com.br/ferramentas/calagem-gessagem",
  }
};

export default async function CalagemGessagemPage() {
  const { userId } = auth();
  const user = await currentUser();
  let isPro = false;
  let userName = "Usuário";

  if (userId && user) {
    userName = user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Usuário";
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    let sub = null;
    try {
      sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });
    } catch(e) {
      // Caso tabela subscriptions não esteja fully sync
    }

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

  return <CalagemGessagemClient isPro={isPro} userName={userName} />;
}
