import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import TransicaoOrganicosClient from "./TransicaoOrganicosClient";

export const metadata: Metadata = {
  title: "Viabilidade de Transição para Orgânicos | Talhão Digital",
  description: "Planeje e simule a conversão técnica e econômica de lavouras convencionais para o sistema orgânico ou certificado. Calcule custos de transição, margens e o tempo de retorno (payback).",
};

export default async function TransicaoOrganicosPage() {
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
      // Ignora erro de tabela não sincronizada
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

  return (
    <TransicaoOrganicosClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
