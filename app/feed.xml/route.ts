import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const baseUrl = 'https://talhaodigital.com.br';

  const posts = await db.query.blogPosts.findMany({
    where: eq(blogPosts.status, 'published'),
    orderBy: desc(blogPosts.publishedAt),
    limit: 20,
  });

  const rssItemsXml = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.summary}]]></description>
      <category><![CDATA[${post.category}]]></category>
    </item>`
    )
    .join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog Talhão Digital - Diagnósticos e Conteúdo Agronômico</title>
    <link>${baseUrl}/blog</link>
    <description>Artigos técnicos, calculadoras e orientações sobre agricultura, pecuária e gestão rural.</description>
    <language>pt-BR</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItemsXml}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
