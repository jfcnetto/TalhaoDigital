import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import ConversorUnidadesClient from "./ConversorUnidadesClient";

export const metadata: Metadata = {
  title: "Conversor de Unidades Agrícolas Regionais | Talhão Digital",
  description: "Converta alqueires (paulista, mineiro, goiano, baiano) em hectares e metros quadrados. Faça conversões de bushels em kg, sacas e toneladas para soja, milho e trigo, além de paridade de preços de exportação.",
};

export default async function ConversorUnidadesPage() {
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
    <ConversorUnidadesClient 
      isPro={isPro}
      userName={userName} 
    />
  );
}
