import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PerfilClient from "./PerfilClient";

export const metadata = {
  title: "Configurações de Perfil e Emissão | Talhão Digital",
  description: "Gerencie suas preferências, dados profissionais, conselho regional (CREA/CRTQ) e logotipo para emissão de laudos técnicos.",
};

export default async function PerfilPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard/perfil");
  }

  return <PerfilClient />;
}
