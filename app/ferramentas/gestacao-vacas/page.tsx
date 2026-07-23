import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import GestacaoVacasClient from "./GestacaoVacasClient";

export const metadata: Metadata = {
  title: "Idade Gestacional e Alertas de Vacas | Talhão Digital",
  description: "Calcule a idade gestacional, Data Provável do Parto (DPP) e receba alertas automáticos de manejo sanitário e nutricional (Secagem, Vacinação e Dieta de Transição) para vacas gestantes.",
};

export default async function GestacaoVacasPage() {
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
    <GestacaoVacasClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
