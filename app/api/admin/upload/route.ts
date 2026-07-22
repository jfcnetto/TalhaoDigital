import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Validar se o remetente é administrador no Clerk ou Postgres
    const caller = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const isAdmin = user.publicMetadata?.role === 'admin' || caller?.role === 'admin';
    if (!isAdmin) {
      return new Response('Forbidden', { status: 403 });
    }

    // 2. Extrair o arquivo FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Gerar um nome único seguro para o arquivo
    const extension = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const filename = `blog-media-${timestamp}.${extension}`;

    let publicUrl = '';

    // 3. Tentar Upload para Cloudflare R2 se configurado
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

        publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, '')}/${filename}`;
      } catch (r2Err) {
        console.warn('Falha no R2, gerando fallback seguro Base64:', r2Err);
      }
    }

    // 4. Fallback garantia total: se o R2 não estiver configurado, converte em Data URL para nunca falhar
    if (!publicUrl) {
      const base64Data = buffer.toString('base64');
      publicUrl = `data:${file.type || 'image/png'};base64,${base64Data}`;
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: filename
    });
  } catch (error: any) {
    console.error('Erro ao processar imagem:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
