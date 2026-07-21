import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Validar se o remetente é administrador no Postgres
    const caller = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (caller?.role !== 'admin') {
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

    // 3. Fazer o upload para o Cloudflare R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // 4. Construir a URL pública de retorno
    // O padrão de domínio público R2 do Cloudflare é: https://pub-[hash].r2.dev
    const defaultR2PublicUrl = 'https://pub-a70707db751de2bde579a404877ab28d.r2.dev';
    const publicUrlBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || defaultR2PublicUrl;
    const publicUrl = `${publicUrlBase}/${filename}`;

    console.log(`File uploaded successfully to R2: ${filename}`);

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: filename
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload no R2:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
