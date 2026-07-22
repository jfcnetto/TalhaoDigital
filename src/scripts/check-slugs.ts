import { db } from '@/db';
import { blogPosts, blogRedirects } from '@/db/schema';

async function listPosts() {
  console.log("=== POSTS CADASTRADOS NO BANCO NEON POSTGRES ===");
  const posts = await db.query.blogPosts.findMany();
  console.log("Total de posts:", posts.length);
  for (const p of posts) {
    console.log(`- ID: ${p.id} | Slug: "${p.slug}" | Status: ${p.status} | Título: ${p.title}`);
  }

  console.log("\n=== REDIRECIONAMENTOS 301 (blogRedirects) ===");
  const redirects = await db.query.blogRedirects.findMany();
  console.log("Total de redirects:", redirects.length);
  for (const r of redirects) {
    console.log(`- OldSlug: "${r.oldSlug}" -> NewSlug: "${r.newSlug}"`);
  }
  process.exit(0);
}

listPosts();
