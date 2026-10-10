// Genera la imagen para compartir (public/og.png) y los iconos PNG a partir de public/favicon.svg.
// Uso: node scripts/brand-assets.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const favicon = readFileSync('public/favicon.svg');
await sharp(favicon, { density: 300 }).resize(32, 32).png().toFile('public/favicon-32.png');
// iPhone/iPad: fondo sólido (iOS no respeta la transparencia)
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#1b1e26' } })
  .composite([{ input: await sharp(favicon, { density: 600 }).resize(140, 140).png().toBuffer(), left: 20, top: 20 }])
  .png()
  .toFile('public/apple-touch-icon.png');

// Imagen al compartir en Discord/WhatsApp/redes: 1200×630
const W = 1200;
const H = 630;
const text = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="g" cx="78%" cy="45%" r="60%"><stop offset="0" stop-color="#e3350d" stop-opacity=".35"/><stop offset="1" stop-color="#e3350d" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#1b1e26"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <g transform="translate(80 110)">
    <circle cx="34" cy="34" r="30" fill="#fff" stroke="#eef0f5" stroke-width="4"/>
    <path d="M4 34a30 30 0 0 1 60 0z" fill="#e3350d"/>
    <rect x="4" y="31" width="60" height="6" fill="#1b1e26"/>
    <circle cx="34" cy="34" r="9" fill="#fff" stroke="#1b1e26" stroke-width="5"/>
    <text x="88" y="48" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="600" fill="#eef0f5">Guía <tspan fill="#e3350d" font-weight="800">Diosesmon</tspan></text>
  </g>
  <text x="80" y="290" font-family="Segoe UI, Arial, sans-serif" font-size="68" font-weight="800" fill="#eef0f5">Pokédex, spawns</text>
  <text x="80" y="370" font-family="Segoe UI, Arial, sans-serif" font-size="68" font-weight="800" fill="#eef0f5">y crianza 6x31</text>
  <text x="80" y="440" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#9aa1b2">Evoluciones · Megas · Interacciones · Fusiones</text>
  <text x="80" y="540" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="600" fill="#e3350d">Guía de Cobblemon en español</text>
</svg>`;
const art = async (id, size) => sharp(`public/img/art/${id}.webp`).resize(size, size).png().toBuffer();
await sharp(Buffer.from(text))
  .composite([
    { input: await art(448, 300), left: 830, top: 60 },
    { input: await art(133, 220), left: 720, top: 330 },
    { input: await art(25, 230), left: 940, top: 360 },
  ])
  .png()
  .toFile('public/og.png');
console.log('ok: og.png, favicon-32.png, apple-touch-icon.png');
