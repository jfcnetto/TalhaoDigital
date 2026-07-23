import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import QuadradoPearsonClient from "./QuadradoPearsonClient";

export const metadata: Metadata = {
  title: "Balanceador de Ração pelo Quadrado de Pearson | Talhão Digital",
  description: "Formule rações balanceadas para bovinos, aves e suínos. Calcule a proporção exata de dois ingredientes para atingir a meta de Proteína Bruta (PB) usando o método do Quadrado de Pearson.",
};

export default async function QuadradoPearsonPage() {
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
    <QuadradoPearsonClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
