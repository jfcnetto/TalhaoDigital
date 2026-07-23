import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import DepreciacaoMaquinasClient from "./DepreciacaoMaquinasClient";

export const metadata: Metadata = {
  title: "Calculadora de Depreciação e Custo Horário de Máquinas | Talhão Digital",
  description: "Calcule a depreciação anual, custo fixo e custo operacional por hora (R$/h) de tratores, colhedoras e implementos agrícolas.",
};

export default async function DepreciacaoMaquinasPage() {
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
    <DepreciacaoMaquinasClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
