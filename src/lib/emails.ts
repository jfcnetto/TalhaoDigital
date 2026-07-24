import { db } from '@/db';
import { billingRecoveryLogs, plans, appSettings } from '@/db/schema';
import { stripe } from '@/lib/stripe';
import { eq } from 'drizzle-orm';

interface EmailPayload {
  userId: string;
  email: string;
  name: string;
  type: 'payment_failed' | 'past_due_warning' | 'manual_test';
  paymentUrl?: string;
  amount?: number;
}

/**
 * Envia um e-mail de recuperação de cobrança com os 3 planos e seus links diretos de checkout do Stripe.
 * Lógica híbrida: Ethereal Email (Dev) vs SMTP Real (Prod).
 */
export async function sendBillingRecoveryEmail({
  userId,
  email,
  name,
  type,
  paymentUrl = 'https://talhaodigital.com.br/dashboard',
  amount = 3990
}: EmailPayload) {
  const formattedAmount = (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const subject = type === 'payment_failed'
    ? '⚠️ Ação Necessária: Falha no pagamento da sua assinatura Talhão Pro'
    : type === 'past_due_warning'
    ? '⚠️ Alerta: Sua assinatura Talhão Pro está em atraso'
    : '🧪 E-mail de Teste: Recuperação de Faturamento - Talhão Digital';

  // 1. Obter planos ativos no banco de dados local
  let activePlans = await db.query.plans.findMany({
    where: eq(plans.active, true),
  });

  // Fallbacks se não houver planos sincronizados
  if (activePlans.length === 0) {
    activePlans = [
      { id: 'price_mock_mensal', name: 'Plano Mensal Pro', amount: 3990, interval: 'month' },
      { id: 'price_mock_trimestral', name: 'Plano Trimestral Pro', amount: 11370, interval: 'month' },
      { id: 'price_mock_semestral', name: 'Plano Semestral Pro', amount: 21540, interval: 'month' },
    ];
  }

  // Ordenar planos pelo valor
  const sortedPlans = [...activePlans].sort((a, b) => a.amount - b.amount);

  // Mapear planos Mensal, Trimestral e Semestral
  const monthlyPlan = sortedPlans.find(p => p.amount < 5000) || sortedPlans[0];
  const quarterlyPlan = sortedPlans.find(p => p.amount >= 5000 && p.amount < 15000) || sortedPlans[1] || sortedPlans[0];
  const semesterPlan = sortedPlans.find(p => p.amount >= 15000) || sortedPlans[2] || sortedPlans[sortedPlans.length - 1];

  // 2. Gerar links reais de Checkout para cada plano dinamicamente no Stripe
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const checkoutLinks: Record<string, string> = {};

  for (const plan of sortedPlans) {
    let checkoutUrl = `${origin}/dashboard?plan=${plan.id}`;
    
    // Se for ID real do Stripe, cria a sessão de checkout
    if (plan.id.startsWith('price_') && !plan.id.includes('mock')) {
      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          line_items: [
            {
              price: plan.id,
              quantity: 1,
            },
          ],
          metadata: {
            userId: userId,
          },
          subscription_data: {
            metadata: {
              userId: userId,
            },
          },
          customer_email: email,
          success_url: `${origin}/dashboard?checkout=success`,
          cancel_url: `${origin}/#planos`,
        });
        if (session.url) {
          checkoutUrl = session.url;
        }
      } catch (err) {
        console.error(`[EmailService] Erro ao criar checkout no Stripe para o plano ${plan.id}:`, err);
      }
    }
    
    checkoutLinks[plan.id] = checkoutUrl;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Talhão Digital</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background-color: #022c22; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; tracking-tight: -0.025em; }
        .header p { margin: 4px 0 0; font-size: 13px; color: #a7f3d0; font-weight: 500; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 16px; }
        .text { font-size: 14px; color: #4b5563; margin-bottom: 24px; }
        .footer { background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 24px; text-align: center; font-size: 11px; color: #9ca3af; }
        .footer a { color: #047857; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TalhãoDigital</h1>
          <p>Laudos e Diagnósticos Agronômicos de Precisão</p>
        </div>
        <div class="content">
          <div class="greeting">Olá, ${name}!</div>
          
          <p class="text">
            Identificamos um problema no processamento da última fatura da sua assinatura **Talhão Pro** (${formattedAmount}). 
            Para manter o seu acesso irrestrito às nossas 19 calculadoras agronômicas e a emissão ilimitada de laudos em PDF personalizados, por favor selecione e assine um dos planos abaixo.
          </p>

          <p class="text" style="font-weight: 600; color: #1f2937;">
            Selecione uma das opções para ir direto ao pagamento seguro no **Stripe**:
          </p>

          <div style="margin: 24px 0;">
            <!-- Plano Mensal -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <div style="text-align: left;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #111827;">Plano Mensal Pro</h3>
                <p style="margin: 4px 0 0; font-size: 11px; color: #6b7280;">Acesso Pro e renovação mensal</p>
                <span style="font-size: 15px; font-weight: 800; color: #047857; display: block; margin-top: 4px;">
                  ${(monthlyPlan.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                </span>
              </div>
              <a href="${checkoutLinks[monthlyPlan.id]}" style="display: inline-block; background-color: #047857; color: #ffffff !important; font-weight: 700; font-size: 12px; text-decoration: none; padding: 10px 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(4,120,87,0.15); white-space: nowrap;" target="_blank">Assinar Mensal</a>
            </div>

            <!-- Plano Trimestral -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <div style="text-align: left;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #111827;">Plano Trimestral Pro <span style="background-color: #fef3c7; color: #d97706; font-size: 9px; padding: 2px 6px; border-radius: 9999px; margin-left: 4px; font-weight: 750;">5% OFF</span></h3>
                <p style="margin: 4px 0 0; font-size: 11px; color: #6b7280;">Equivale a R$ 37,90/mês</p>
                <span style="font-size: 15px; font-weight: 800; color: #047857; display: block; margin-top: 4px;">
                  ${(quarterlyPlan.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/trimestre
                </span>
              </div>
              <a href="${checkoutLinks[quarterlyPlan.id]}" style="display: inline-block; background-color: #047857; color: #ffffff !important; font-weight: 700; font-size: 12px; text-decoration: none; padding: 10px 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(4,120,87,0.15); white-space: nowrap;" target="_blank">Assinar Trimestral</a>
            </div>

            <!-- Plano Semestral -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <div style="text-align: left;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #111827;">Plano Semestral Pro <span style="background-color: #ecfdf5; color: #047857; font-size: 9px; padding: 2px 6px; border-radius: 9999px; margin-left: 4px; font-weight: 750;">10% OFF</span></h3>
                <p style="margin: 4px 0 0; font-size: 11px; color: #6b7280;">Equivale a R$ 35,90/mês</p>
                <span style="font-size: 15px; font-weight: 800; color: #047857; display: block; margin-top: 4px;">
                  ${(semesterPlan.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/semestre
                </span>
              </div>
              <a href="${checkoutLinks[semesterPlan.id]}" style="display: inline-block; background-color: #047857; color: #ffffff !important; font-weight: 700; font-size: 12px; text-decoration: none; padding: 10px 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(4,120,87,0.15); white-space: nowrap;" target="_blank">Assinar Semestral</a>
            </div>
          </div>

          <p class="text" style="font-size: 12px; color: #9ca3af;">
            Se o seu pagamento já foi regularizado ou se prefere gerenciar seu cartão diretamente, você pode acessar seu portal de faturamento na sua conta do aplicativo a qualquer momento.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Talhão Digital. Todos os direitos reservados.<br>
          Dúvidas ou suporte? Entre em contato pelo e-mail: <a href="mailto:suporte@talhaodigital.com.br">suporte@talhaodigital.com.br</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Talhão Digital - Laudos e Diagnósticos Agronômicos de Precisão
    
    Olá, ${name}!
    
    Identificamos um problema no processamento da última fatura da sua assinatura Talhão Pro (${formattedAmount}).
    Para manter seu acesso completo, por favor selecione uma das opções abaixo e assine diretamente pelo Stripe:
    
    1. Plano Mensal: R$ 39,90/mês
       Link: ${checkoutLinks[monthlyPlan.id]}
       
    2. Plano Trimestral: R$ 113,70/trimestre (Economia de 5%)
       Link: ${checkoutLinks[quarterlyPlan.id]}
       
    3. Plano Semestral: R$ 215,40/semestre (Economia de 10%)
       Link: ${checkoutLinks[semesterPlan.id]}
    
    Equipe Talhão Digital.
  `;

  let previewUrl: string | null = null;
  let status: 'sent' | 'simulated' | 'failed' = 'simulated';

  try {
    // Tenta carregar o nodemailer usando eval('require') para evitar erro de compilação do Webpack/Next.js
    let nodemailer;
    try {
      const req = eval('require');
      nodemailer = req('nodemailer');
    } catch (e) {
      throw new Error('Nodemailer não instalado');
    }
    
    // Tenta obter as configurações SMTP do banco de dados first
    let host = process.env.SMTP_HOST;
    let port = process.env.SMTP_PORT || '587';
    let user = process.env.SMTP_USER;
    let pass = process.env.SMTP_PASS;
    let secure = process.env.SMTP_SECURE === 'true';
    let fromEmail = process.env.SMTP_FROM || '"Talhão Digital" <suporte@talhaodigital.com.br>';

    try {
      const configRecord = await db.query.appSettings.findFirst({
        where: eq(appSettings.id, 'smtp_config'),
      });
      if (configRecord && configRecord.value) {
        const val = configRecord.value as any;
        if (val.host && val.user && val.pass) {
          host = val.host;
          port = val.port || '587';
          user = val.user;
          pass = val.pass;
          secure = val.secure === true || val.secure === 'true';
          fromEmail = val.fromEmail || fromEmail;
          console.log('[EmailService] Utilizando SMTP configurado no Banco de Dados.');
        }
      }
    } catch (dbErr) {
      console.error('[EmailService] Erro ao buscar SMTP do banco de dados, usando fallbacks:', dbErr);
    }

    let transporter;
    const isProdSMTP = !!(host && user && pass);

    if (isProdSMTP) {
      console.log(`[EmailService] Configurando SMTP para enviar para ${email}`);
      transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: secure,
        auth: {
          user: user,
          pass: pass,
        },
      });
      status = 'sent';
    } else {
      console.log('[EmailService] SMTP de Produção/Banco de Dados ausente. Gerando conta Ethereal Email de testes...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      status = 'sent';
    }

    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
    });

    if (!isProdSMTP) {
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
      console.log('\n==================================================');
      console.log('🧪 [ETHEREAL EMAIL SENT]');
      console.log(`Para: ${email}`);
      console.log(`Assunto: ${subject}`);
      console.log(`URL de Visualização: ${previewUrl}`);
      console.log('==================================================\n');
    } else {
      console.log(`[EmailService] E-mail enviado com sucesso via SMTP de Produção para ${email}. Message ID: ${info.messageId}`);
    }

  } catch (err: any) {
    console.error('⚠️ [EmailService Error] Falha ao enviar e-mail com Nodemailer:', err.message);
    console.log('\n--- SIMULAÇÃO DE EMAIL NO LOG (Fallback Sem Nodemailer) ---');
    console.log(`Assunto: ${subject}`);
    console.log(`Para: ${email}`);
    console.log(`Corpo de Texto:\n${textContent}`);
    console.log('-----------------------------------------------------------\n');
    status = 'simulated';
  }

  // Registrar no banco de dados
  try {
    await db.insert(billingRecoveryLogs).values({
      userId,
      email,
      type,
      status,
      previewUrl,
    });
  } catch (dbErr) {
    console.error('Erro ao salvar log de recuperação no banco de dados:', dbErr);
  }

  return { success: true, status, previewUrl };
}
