import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Dirección pública de la web: se usa en las vistas previas al compartir (Open Graph) y en las URL canónicas.
  // Si algún día usas un dominio propio, cámbialo aquí.
  site: 'https://diosesmon-fan-guia.yesper233.workers.dev',
  // precarga la página al pasar el mouse (o tocar) un enlace: la navegación se siente instantánea
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  image: { domains: ['raw.githubusercontent.com'] },
  // ruta absoluta a public/ para saber qué imágenes opcionales existen (src/lib/public.ts)
  vite: { define: { __PUBLIC_DIR__: JSON.stringify(fileURLToPath(new URL('./public/', import.meta.url))) } },
});
