import { defineConfig } from 'astro/config';

export default defineConfig({
  // Dirección pública de la web: se usa en las vistas previas al compartir (Open Graph) y en las URL canónicas.
  // Cámbiala por el dominio final (ej. el *.pages.dev que te dé Cloudflare o un dominio propio).
  site: 'https://guia-diosesmon.pages.dev',
  // precarga la página al pasar el mouse (o tocar) un enlace: la navegación se siente instantánea
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  image: { domains: ['raw.githubusercontent.com'] },
});
