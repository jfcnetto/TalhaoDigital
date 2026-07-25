import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET: Listar todos os laudos do usuário logado
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userReports = await db.query.reports.findMany({
      where: eq(reports.userId, userId),
      orderBy: desc(reports.createdAt),
    });

    // Formata dinamicamente para injetar nomeLaudo, shareLink e professionalData a partir do JSONB clientData
    const formattedReports = userReports.map((report) => {
      const clientData: any = report.clientData || {};
      const professionalData = clientData.professional || {};

      const formattedClientData = { ...clientData };
      delete formattedClientData.professional;

      return {
        ...report,
        nomeLaudo: clientData.nomeLaudo || null,
        shareLink: clientData.shareLink || null,
        professionalData,
        clientData: formattedClientData
      };
    });

    return NextResponse.json(formattedReports);
  } catch (error: any) {
    console.error('Erro ao listar laudos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salvar um novo laudo
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { toolId, area, inputs, results, professionalData, clientData } = body;

    if (!toolId || !area || !inputs || !results) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const combinedClientData = {
      ...(clientData || {}),
      professional: professionalData || {}
    };

    const inserted = await db.insert(reports).values({
      userId,
      toolId,
      area,
      inputs,
      results,
      clientData: combinedClientData,
      createdAt: new Date(),
    }).returning();

    // Formata o retorno para a calculadora
    const insertedReport = inserted[0];
    const clientDataObj: any = insertedReport.clientData || {};
    const profData = clientDataObj.professional || {};
    const formattedClient = { ...clientDataObj };
    delete formattedClient.professional;

    const formattedInserted = {
      ...insertedReport,
      nomeLaudo: clientDataObj.nomeLaudo || null,
      shareLink: clientDataObj.shareLink || null,
      professionalData: profData,
      clientData: formattedClient
    };

    return NextResponse.json({ success: true, report: formattedInserted });
  } catch (error: any) {
    console.error('Erro ao salvar laudo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
