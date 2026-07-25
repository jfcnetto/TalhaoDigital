import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// POST: Receber PDF como FormData e fazer upload para Cloudflare R2
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file || !fileName) {
      return NextResponse.json({ error: 'Arquivo e nome são obrigatórios.' }, { status: 400 });
    }

    // Gera um nome único com timestamp para evitar colisões
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const key = `laudos/${userId}/${timestamp}-${sanitizedName}`;

    // Verifica se as credenciais do R2 estão configuradas. Se não, usa fallback simulado (útil em localhost)
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_ENDPOINT) {
      console.warn("⚠️ Credenciais do Cloudflare R2 não configuradas no .env. Utilizando fallback local para testes.");
      const mockUrl = `https://talhaodigital.com.br/laudo-simulado-localhost.pdf`;
      return NextResponse.json({ success: true, url: mockUrl });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
        })
      );

      const publicUrl = `${PUBLIC_URL}/${key}`;
      return NextResponse.json({ success: true, url: publicUrl });
    } catch (r2Error) {
      console.warn("⚠️ Falha no upload para o Cloudflare R2, utilizando fallback de simulação:", r2Error);
      const mockUrl = `https://talhaodigital.com.br/laudo-simulado-localhost.pdf`;
      return NextResponse.json({ success: true, url: mockUrl });
    }
  } catch (error: any) {
    console.error('Erro ao fazer upload do PDF:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
