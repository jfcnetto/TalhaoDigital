import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

// GET: Buscar detalhes de um laudo específico
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const report = await db.query.reports.findFirst({
      where: and(
        eq(reports.id, reportId),
        eq(reports.userId, userId)
      ),
    });

    if (!report) {
      return NextResponse.json({ error: 'Laudo não encontrado.' }, { status: 404 });
    }

    const clientData: any = report.clientData || {};
    const professionalData = clientData.professional || {};

    // Remove professionalData de dentro de clientData para evitar duplicidade visual se necessário
    const formattedClientData = { ...clientData };
    delete formattedClientData.professional;

    const formattedReport = {
      ...report,
      nomeLaudo: clientData.nomeLaudo || null,
      shareLink: clientData.shareLink || null,
      professionalData,
      clientData: formattedClientData
    };

    return NextResponse.json(formattedReport);
  } catch (error: any) {
    console.error('Erro ao buscar laudo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir um laudo específico do histórico
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    // Deleta garantindo que pertence ao usuário logado
    const result = await db.delete(reports)
      .where(
        and(
          eq(reports.id, reportId),
          eq(reports.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Laudo não encontrado ou acesso negado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Laudo excluído com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao excluir laudo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
