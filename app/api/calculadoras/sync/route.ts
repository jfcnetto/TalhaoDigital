import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    // 1. Identificar o usuário na nuvem
    const { userId } = auth();
    
    // NOTA: Se userId não existir, significa que a sessão expirou ou ele nunca logou.
    // Opcionalmente podemos salvar os laudos atrelados a um "visitante" temporário,
    // mas o ideal é que ele tenha feito login antes.
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não autenticado. Faça login online primeiro.' }, { status: 401 });
    }

    const { itens } = await req.json();

    if (!itens || !Array.isArray(itens)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    console.log(`Recebidos ${itens.length} cálculos para sincronização do usuário ${userId}.`);

    // 2. Aqui faremos o INSERT no banco de dados Neon (Postgres)
    // Exemplo:
    // for (const item of itens) {
    //   await db.insert(calculos).values({
    //     userId,
    //     tipo: item.tipo,
    //     payload: item.payload,
    //     criadoEmOffline: new Date(item.data)
    //   });
    // }

    // Por enquanto, apenas simulamos sucesso. O banco real será integrado em cada calculadora.
    return NextResponse.json({ success: true, count: itens.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
