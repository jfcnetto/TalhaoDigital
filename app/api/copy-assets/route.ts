import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const srcDir = 'C:\\Users\\jfcne_felc0s1\\.gemini\\antigravity-ide\\brain\\aaa52ca6-527f-4598-9a30-616ab07ff942';
    const destDir = path.join(process.cwd(), 'public');

    // Garantir que a pasta public existe
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copiar logo
    const logoSrc = path.join(srcDir, 'media__1784589639580.png');
    const logoDest = path.join(destDir, 'logo.png');
    if (fs.existsSync(logoSrc)) {
      fs.copyFileSync(logoSrc, logoDest);
    }

    // Copiar favicon
    const favSrc = path.join(srcDir, 'media__1784589649195.png');
    const favDest = path.join(destDir, 'favicon.png');
    if (fs.existsSync(favSrc)) {
      fs.copyFileSync(favSrc, favDest);
    }

    return NextResponse.json({ success: true, message: 'Assets copied successfully' });
  } catch (error: any) {
    console.error('Error copying assets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
