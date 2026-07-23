import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import PontoEquilibrioClient from "./PontoEquilibrioClient";

export const metadata: Metadata = {
  title: "Ponto de Equilíbrio por Hectare | Talhão Digital",
  description: "Calcule a margem de contribuição (R$/ha e %) e determine o ponto de equilíbrio (lotação em sacas/ha e preço de venda mínimo) de sua produção agrícola.",
};

export default async function PontoEquilibrioPage() {
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
    <PontoEquilibrioClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
