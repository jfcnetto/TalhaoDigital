import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, appSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    let finalPassword = pass;
    
    // Se a senha vier como a máscara, busca a senha salva anteriormente
    if (pass === '••••••••••••••••') {
      const existing = await db.query.appSettings.findFirst({
        where: eq(appSettings.id, 'smtp_config'),
      });
      if (existing) {
        finalPassword = (existing.value as any).pass || '';
      }
    }

    if (!host || !user || !finalPassword) {
      return NextResponse.json({ error: 'Host, Usuário e Senha são obrigatórios para o teste.' }, { status: 400 });
    }

    // Tenta carregar o nodemailer dinamicamente de forma invisível ao compilador Next.js/Webpack
    let nodemailer;
    try {
      const reqResolver = eval('require');
      nodemailer = reqResolver('nodemailer');
    } catch (e) {
      return NextResponse.json({ error: 'A biblioteca Nodemailer não está instalada no servidor.' }, { status: 500 });
    }

    console.log(`[SMTP-Test] Iniciando teste de conexão para o host: ${host}`);

    const transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(port || '587'),
      secure: secure === true || secure === 'true',
      auth: {
        user: user,
        pass: finalPassword,
      },
    });

    // 1. Verificar credenciais
    await transporter.verify();

    // 2. Enviar email de teste real
    const fromAddress = fromEmail || `"${dbUser.name || 'Admin'}" <${user}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: dbUser.email,
      subject: '🧪 Conexão SMTP Realizada com Sucesso - Talhão Digital',
      text: `Olá, ${dbUser.name || 'Admin'}!\n\nEste é um e-mail de teste disparado pelo painel administrativo do Talhão Digital.\nSua conexão SMTP foi estabelecida e validada com sucesso!\n\nConfiguração utilizada:\n- Host: ${host}\n- Porta: ${port}\n- Usuário: ${user}\n- SSL/TLS: ${secure ? 'Ativo' : 'Inativo'}\n\nAbraço,\nEquipe Talhão Digital`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #022c22; color: #ffffff; padding: 24px; text-align: center;">
            <h2 style="margin: 0;">Talhão Digital</h2>
            <p style="margin: 4px 0 0; font-size: 13px; color: #a7f3d0;">E-mail de Teste do Sistema</p>
          </div>
          <div style="padding: 24px; line-height: 1.6; color: #374151;">
            <p>Olá, <strong>${dbUser.name || 'Admin'}</strong>!</p>
            <p>Este é um e-mail de teste disparado para confirmar que suas configurações personalizadas de SMTP estão corretas.</p>
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h4 style="margin: 0 0 8px 0; color: #111827;">Detalhes da Conexão:</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
                <li><strong>Servidor SMTP:</strong> ${host}</li>
                <li><strong>Porta:</strong> ${port}</li>
                <li><strong>Usuário SMTP:</strong> ${user}</li>
                <li><strong>SSL/TLS (Secure):</strong> ${secure ? 'Ativado' : 'Desativado'}</li>
              </ul>
            </div>
            <p style="color: #047857; font-weight: bold; text-align: center; font-size: 15px; margin-top: 24px;">
              ✓ Conexão Estabelecida com Sucesso!
            </p>
          </div>
          <div style="background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
            Talhão Digital - Configurações Administrativas
          </div>
        </div>
      `,
    });

    console.log(`[SMTP-Test] E-mail de teste enviado com sucesso para ${dbUser.email}. MessageId: ${info.messageId}`);

    return NextResponse.json({
      success: true,
      message: `Conexão SMTP validada com sucesso! E-mail de teste enviado para ${dbUser.email}.`,
    });
  } catch (error: any) {
    console.error('[SMTP-Test] Falha na conexão ou envio de teste SMTP:', error);
    return NextResponse.json({
      error: `Falha na validação SMTP: ${error.message || 'Erro desconhecido'}`,
    }, { status: 500 });
  }
}
