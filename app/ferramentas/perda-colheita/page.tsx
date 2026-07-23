import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import PerdaColheitaClient from "./PerdaColheitaClient";

export const metadata: Metadata = {
  title: "Estimador de Perda de Grãos na Colheita | Talhão Digital",
  description: "Calcule a perda de grãos (kg/ha e sacas/ha) na colheita mecanizada de soja e milho utilizando o método oficial do copo medidor ou aro de amostragem.",
};

export default async function PerdaColheitaPage() {
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
    <PerdaColheitaClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
