import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import RendimentoCarcacaClient from "./RendimentoCarcacaClient";

export const metadata: Metadata = {
  title: "Simulador de Rendimento de Carcaça e Valor da Arroba | Talhão Digital",
  description: "Simule e calcule o rendimento de carcaça de bovinos de corte. Estime o peso quente da carcaça em arrobas (@) e projete o faturamento com base na cotação da arroba.",
};

export default async function RendimentoCarcacaPage() {
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
    <RendimentoCarcacaClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
