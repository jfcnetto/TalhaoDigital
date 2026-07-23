import type { Metadata } from "next";
import AjudaClient from "./AjudaClient";

export const metadata: Metadata = {
  title: "Central de Ajuda e Instruções | Talhão Digital",
  description: "Aprenda a utilizar cada uma das calculadoras do Talhão Digital. Passo a passo para calagem, NPK, bicos, silagem, ponto de equilíbrio, barter e muito mais.",
};

export default function AjudaPage() {
  return <AjudaClient />;
}
