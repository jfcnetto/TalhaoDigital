import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: Retorna os dados do perfil complementar do usuário
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response("Não autorizado", { status: 401 });
    }

    // Auto-migração preventiva de contingência (garante que as colunas existam)
    try {
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS professional_type text,
        ADD COLUMN IF NOT EXISTS crea_crtq text,
        ADD COLUMN IF NOT EXISTS conselho_estado text,
        ADD COLUMN IF NOT EXISTS cpf_cnpj text,
        ADD COLUMN IF NOT EXISTS phone text,
        ADD COLUMN IF NOT EXISTS logo_url text,
        ADD COLUMN IF NOT EXISTS avatar_url text;
      `);
    } catch (e) {
      console.warn("Erro preventivo de migração de colunas de usuário:", e);
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      name: dbUser.name || "",
      email: dbUser.email || "",
      professionalType: dbUser.professionalType || "",
      creaCrtq: dbUser.creaCrtq || "",
      conselhoEstado: dbUser.conselhoEstado || "",
      cpfCnpj: dbUser.cpfCnpj || "",
      phone: dbUser.phone || "",
      logoUrl: dbUser.logoUrl || "",
      avatarUrl: dbUser.avatarUrl || "",
    });
  } catch (error: any) {
    console.error("Erro ao obter perfil:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST/PUT: Atualiza os dados de perfil do usuário
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response("Não autorizado", { status: 401 });
    }

    const body = await req.json();
    const { name, professionalType, creaCrtq, conselhoEstado, cpfCnpj, phone, logoUrl, avatarUrl } = body;

    // Validação de Nome Obrigatório
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "O Nome do Responsável Técnico é obrigatório." }, { status: 400 });
    }

    // Validação de CREA Obrigatório para Engenheiro Agrônomo
    if (professionalType === "agronomo" && (!creaCrtq || creaCrtq.trim() === "")) {
      return NextResponse.json({ error: "O preenchimento do CREA/CRTQ é obrigatório para Engenheiros Agrônomos." }, { status: 400 });
    }

    // Atualiza os dados no banco
    const updated = await db
      .update(users)
      .set({
        name: name.trim(),
        professionalType: professionalType || null,
        creaCrtq: creaCrtq || null,
        conselhoEstado: conselhoEstado || null,
        cpfCnpj: cpfCnpj || null,
        phone: phone || null,
        logoUrl: logoUrl || null,
        avatarUrl: avatarUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({
      success: true,
      user: updated[0],
    });
  } catch (error: any) {
    console.error("Erro ao salvar perfil:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PUT(req: Request) {
  return POST(req);
}
