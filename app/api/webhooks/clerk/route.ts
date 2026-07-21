import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  // 1. Obter o segredo do Clerk Webhook do arquivo .env.local
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is missing from environment variables');
    return new Response('Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local', {
      status: 500,
    });
  }

  // 2. Obter os cabeçalhos do Svix para verificação de assinatura
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Se não houver cabeçalhos, aborta a operação
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // 3. Obter o corpo (payload) da requisição
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // 4. Instanciar o Svix Webhook para validar a assinatura
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  // 5. Processar o evento verificado
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;

    const primaryEmail = (email_addresses && email_addresses[0]?.email_address) || `${id}@placeholder.com`;
    const fullName = [first_name, last_name].filter(Boolean).join(' ');

    // Extrai a role a partir do publicMetadata do Clerk (padrão é subscriber)
    const metadataRole = (public_metadata as { role?: string })?.role;
    const userRole = metadataRole === 'admin' ? 'admin' : 'subscriber';

    try {
      // Salva ou atualiza o usuário no Neon Postgres com a Role correta
      await db.insert(users).values({
        id,
        email: primaryEmail,
        name: fullName || null,
        role: userRole,
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          email: primaryEmail,
          name: fullName || null,
          role: userRole,
          updatedAt: new Date(),
        }
      });

      console.log(`User synced to database successfully: ${id}`);
      return new Response('User created/updated successfully', { status: 200 });
    } catch (dbError) {
      console.error('Database insertion error during user sync:', dbError);
      return new Response('Database error', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    if (!id) {
      return new Response('Error: Missing user ID', { status: 400 });
    }

    try {
      // Deleta ou anonimiza o usuário em conformidade com a LGPD (RN-014)
      await db.delete(users).where(eq(users.id, id));
      console.log(`User deleted from database due to Clerk deletion: ${id}`);
      return new Response('User deleted successfully', { status: 200 });
    } catch (dbError) {
      console.error('Database deletion error during user sync:', dbError);
      return new Response('Database error', { status: 500 });
    }
  }

  return new Response('Webhook received and verified', { status: 200 });
}
