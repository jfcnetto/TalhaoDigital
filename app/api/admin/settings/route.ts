import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, appSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET: Retorna as configurações SMTP mascaradas
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 });
    }

    const configRecord = await db.query.appSettings.findFirst({
      where: eq(appSettings.id, 'smtp_config'),
    });

    if (!configRecord) {
      return NextResponse.json({
        host: '',
        port: '587',
        user: '',
        pass: '',
        fromEmail: '',
        secure: false,
        hasPassword: false,
      });
    }

    const val = configRecord.value as any;
    return NextResponse.json({
      host: val.host || '',
      port: val.port || '587',
      user: val.user || '',
      pass: val.pass ? '••••••••••••••••' : '',
      fromEmail: val.fromEmail || '',
      secure: val.secure === true || val.secure === 'true',
      hasPassword: !!val.pass,
    });
  } catch (error: any) {
    console.error('Erro ao buscar configurações SMTP:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salva ou atualiza as configurações SMTP
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso proibido' }, { status: 403 });
    }

    const body = await req.json();
    const { host, port, user, pass, fromEmail, secure } = body;

    // Busca o registro atual para ver se existe senha salva
    const existing = await db.query.appSettings.findFirst({
      where: eq(appSettings.id, 'smtp_config'),
    });

    let finalPassword = pass;
    
    // Se a senha vier como a máscara, mantém a senha antiga
    if (pass === '••••••••••••••••' && existing) {
      finalPassword = (existing.value as any).pass || '';
    }

    const newValue = {
      host: host || '',
      port: port || '587',
      user: user || '',
      pass: finalPassword || '',
      fromEmail: fromEmail || '',
      secure: secure === true || secure === 'true',
    };

    await db.insert(appSettings).values({
      id: 'smtp_config',
      value: newValue,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: appSettings.id,
      set: {
        value: newValue,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, message: 'Configurações SMTP salvas com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao salvar configurações SMTP:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
