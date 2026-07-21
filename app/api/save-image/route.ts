import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { filename, dataUrl } = await req.json();

    if (!filename || !dataUrl) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Remover o cabeçalho "data:image/png;base64,"
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Caminho da pasta public
    const publicDir = path.join(process.cwd(), 'public');
    
    // Garantir que a pasta public existe
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, filename);
    fs.writeFileSync(filePath, buffer);

    console.log(`Saved image successfully to: ${filePath}`);
    return NextResponse.json({ success: true, path: filePath });
  } catch (error: any) {
    console.error('Error saving image:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
