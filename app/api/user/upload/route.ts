import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response("Não autorizado", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const uploadType = formData.get("type") as string || "logo"; // "logo" ou "avatar"

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Gerar nome único seguro para o arquivo
    const extension = file.name.split(".").pop() || "png";
    const timestamp = Date.now();
    const filename = `user-${uploadType}-${userId}-${timestamp}.${extension}`;

    let publicUrl = "";

    // 1. Tentar upload para Cloudflare R2 se configurado
    if (
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
      process.env.CLOUDFLARE_R2_ENDPOINT &&
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL
    ) {
      try {
        const r2Client = new S3Client({
          region: "auto",
          endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
          },
        });

        const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "talhaodigital-storage";

        await r2Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: buffer,
            ContentType: file.type,
          })
        );

        publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, "")}/${filename}`;
      } catch (r2Err) {
        console.warn("Falha no upload para o R2, gerando fallback Base64:", r2Err);
      }
    }

    // 2. Fallback: Se o R2 falhar ou não estiver configurado, converte em Base64 Data URL
    if (!publicUrl) {
      const base64Data = buffer.toString("base64");
      publicUrl = `data:${file.type || "image/png"};base64,${base64Data}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
    });
  } catch (error: any) {
    console.error("Erro no processamento do upload:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
