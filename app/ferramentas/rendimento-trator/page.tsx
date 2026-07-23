import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import RendimentoTratorClient from "./RendimentoTratorClient";

export const metadata: Metadata = {
  title: "Planejador de Rendimento Operacional de Tratores | Talhão Digital",
  description: "Calcule a capacidade de campo (ha/h), rendimento operacional e tempo necessário para realizar operações agrícolas mecanizadas com tratores.",
};

export default async function RendimentoTratorPage() {
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
    <RendimentoTratorClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
