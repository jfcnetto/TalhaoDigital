import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, mediaLibrary } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

async function checkAdmin(userId: string) {
  const user = await currentUser();
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  return user?.publicMetadata?.role === 'admin' || dbUser?.role === 'admin';
}

// GET: Listar todas as mídias salvas na Biblioteca
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const items = await db.query.mediaLibrary.findMany({
      orderBy: desc(mediaLibrary.createdAt),
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Upload no R2 + Registro na Biblioteca de Mídia
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const altText = (formData.get('altText') as string) || file?.name || 'Imagem do Blog';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Processar arquivo
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const filename = `blog-media-${timestamp}.${extension}`;
    
    let publicUrl = '';
    const { PutObjectCommand, S3Client } = await import('@aws-sdk/client-s3');

    // Tentar Upload para Cloudflare R2 se configurado TOTALMENTE
    if (
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
      process.env.CLOUDFLARE_R2_ENDPOINT &&
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL
    ) {
      try {
        const r2Client = new S3Client({
          region: 'auto',
          endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
          },
        });

        const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'talhaodigital-storage';

        await r2Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: buffer,
            ContentType: file.type,
          })
        );

        // Somente usamos a URL pública configurada (nunca deduzida)
        publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, '')}/${filename}`;
      } catch (r2Err) {
        console.warn('Falha no R2, gerando fallback seguro Base64:', r2Err);
      }
    } else {
      console.warn('R2 incompleto (Falta NEXT_PUBLIC_R2_PUBLIC_URL). Usando Base64 fallback.');
    }

    // Fallback garantia total: Base64
    if (!publicUrl) {
      const base64Data = buffer.toString('base64');
      publicUrl = `data:${file.type || 'image/png'};base64,${base64Data}`;
    }

    // Gravar na tabela mediaLibrary
    const [media] = await db.insert(mediaLibrary).values({
      filename: file.name,
      url: publicUrl,
      key: filename,
      altText,
      mimeType: file.type,
      fileSize: file.size,
    }).returning();

    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    console.error('Erro no upload de midia:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir mídia da biblioteca
export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID da mídia é obrigatório' }, { status: 400 });

    await db.delete(mediaLibrary).where(eq(mediaLibrary.id, Number(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
