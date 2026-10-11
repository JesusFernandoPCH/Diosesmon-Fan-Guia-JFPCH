// Genera rareza-pokemon.csv: todos los Pokémon del servidor con la rareza que muestra la web y la que dice Cobblemon,
// para revisarlos en Excel/Sheets. Se rellena la última columna y se importa con: node scripts/rarity-apply.mjs rareza-pokemon.csv
// Uso: node scripts/rarity-csv.mjs
import { writeFileSync } from 'node:fs';
import pokemon from '../src/data/pokemon.json' with { type: 'json' };
import { ENABLED_GENS } from '../src/data/config.ts';
import { rarityOf } from '../src/lib/rarity.ts';

const NAME = { common: 'Común', uncommon: 'Poco común', rare: 'Rara', 'ultra-rare': 'Ultra rara', boss: 'Alfa' };
const POS = { grounded: 'Tierra', surface: 'Superficie del agua', submerged: 'Bajo el agua', seafloor: 'Fondo marino', fishing: 'Pesca' };

// Resumen de lo que dice Cobblemon: por rareza, cuántas apariciones y dónde (y si son de un lugar especial)
const summary = (p) => {
  const by = new Map();
  for (const s of p.spawns) {
    const k = s.alpha ? 'boss' : s.bucket;
    const e = by.get(k) ?? { n: 0, pos: new Set(), special: 0 };
    e.n++;
    e.pos.add(POS[s.pos] ?? s.pos);
    if (s.places?.length) e.special++;
    by.set(k, e);
  }
  return [...by]
    .sort((a, b) => Object.keys(NAME).indexOf(a[0]) - Object.keys(NAME).indexOf(b[0]))
    .map(([k, e]) => `${NAME[k]}: ${e.n} aparición(es) en ${[...e.pos].join('/')}${e.special === e.n ? ' (solo en lugares especiales)' : e.special ? ` (${e.special} en lugares especiales)` : ''}`)
    .join(' | ');
};

const cell = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
const rows = [['N°', 'Pokémon', 'Nombre en inglés', 'Rareza que muestra la web', 'Rareza según Cobblemon (cada aparición)', 'Rareza correcta (Común / Poco común / Rara / Ultra rara)']];
for (const p of pokemon.filter((p) => ENABLED_GENS.includes(p.gen))) {
  const shown = rarityOf(p);
  rows.push([p.id, p.es, p.en, shown ? NAME[shown] : 'Sin apariciones salvajes', summary(p) || '—', '']);
}
// BOM + ";" para que Excel en español lo abra con acentos y en columnas
writeFileSync(new URL('../rareza-pokemon.csv', import.meta.url), '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n');
console.log(rows.length - 1, 'Pokémon en rareza-pokemon.csv');
