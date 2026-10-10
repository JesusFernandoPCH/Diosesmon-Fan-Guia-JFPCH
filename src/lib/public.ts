// ¿Existe este archivo en public/? (para mostrar imágenes opcionales: fusiones, recetas, estructuras).
// La ruta a public/ viene de astro.config.mjs y es absoluta: así funciona aunque el build se ejecute desde otra
// carpeta (en Cloudflare una ruta relativa no encontraba las imágenes).
import { existsSync } from 'node:fs';
import { join } from 'node:path';

declare const __PUBLIC_DIR__: string;

export const inPublic = (path: string) => existsSync(join(__PUBLIC_DIR__, path));
