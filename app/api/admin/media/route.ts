import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, mediaLibrary } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET: Listar todas as mídias salvas na Biblioteca
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (dbUser?.role !== 'admin') {
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

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const altText = (formData.get('altText') as string) || file?.name || 'Imagem do Blog';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Fazer upload para o R2 via endpoint de upload existente
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadRes = await fetch(new URL('/api/admin/upload', req.url).toString(), {
      method: 'POST',
      body: uploadFormData,
      headers: {
        cookie: req.headers.get('cookie') || '',
      }
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.url) {
      throw new Error(uploadData.error || 'Erro no upload para o Cloudflare R2');
    }

    // Gravar na tabela mediaLibrary
    const [media] = await db.insert(mediaLibrary).values({
      filename: file.name,
      url: uploadData.url,
      key: uploadData.key || file.name,
      altText,
      mimeType: file.type,
      fileSize: file.size,
    }).returning();

    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir mídia da biblioteca
export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (dbUser?.role !== 'admin') {
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
