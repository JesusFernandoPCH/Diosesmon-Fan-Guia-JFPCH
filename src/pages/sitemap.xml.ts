// Mapa del sitio para Google y Bing: /sitemap.xml (se genera al construir, con todas las páginas).
import type { APIRoute } from 'astro';
import { sections } from '../data/sections';
import { all } from '../lib/evo';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://example.com');
  const pages = [
    { path: '/', priority: '1.0' },
    ...sections.map((s) => ({ path: `/${s.slug}/`, priority: s.slug === 'crianza' || s.slug === 'pokedex' ? '0.9' : '0.8' })),
    ...all.map((p) => ({ path: `/pokemon/${p.slug}/`, priority: '0.6' })),
    { path: '/legal/', priority: '0.2' },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${new URL(p.path, base).href}</loc><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
