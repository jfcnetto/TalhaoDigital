import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import SuportePastagemClient from "./SuportePastagemClient";

export const metadata: Metadata = {
  title: "Capacidade de Suporte de Pastagem | Talhão Digital",
  description: "Calcule a capacidade de suporte de pastagem em Unidade Animal (UA/ha) e planeje a lotação animal ideal baseando-se na produção de matéria seca e no período de pastejo.",
};

export default async function SuportePastagemPage() {
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
    <SuportePastagemClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
