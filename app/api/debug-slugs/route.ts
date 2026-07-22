import { NextResponse } from 'next/server';
import { db } from '@/db';
import { blogPosts } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await db.query.blogPosts.findMany();
    return NextResponse.json({
      total: posts.length,
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
