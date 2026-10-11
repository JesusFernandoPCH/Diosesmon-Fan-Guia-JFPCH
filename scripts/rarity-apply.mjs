// Importa las rarezas corregidas a mano: lee la última columna del CSV y escribe src/data/rarity.json.
// Solo cuentan las filas con algo escrito en "Rareza correcta"; las vacías siguen con la rareza de Cobblemon.
// Uso: node scripts/rarity-apply.mjs rareza-pokemon.csv
import { readFileSync, writeFileSync } from 'node:fs';
import pokemon from '../src/data/pokemon.json' with { type: 'json' };

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const KEYS = { comun: 'common', 'poco comun': 'uncommon', rara: 'rare', raro: 'rare', 'ultra rara': 'ultra-rare', 'muy raro': 'ultra-rare', 'ultra raro': 'ultra-rare' };

const file = process.argv[2];
if (!file) throw new Error('Uso: node scripts/rarity-apply.mjs rareza-pokemon.csv');
const text = readFileSync(file, 'utf8').replace(/^﻿/, '');
// CSV con comillas (como lo guarda Excel)
const sep = text.split('\n')[0].includes(';') ? ';' : ','; // según la configuración regional de Excel
const parse = (src) => {
  const rows = [[]];
  let cur = '', q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) c === '"' ? (src[i + 1] === '"' ? ((cur += '"'), i++) : (q = false)) : (cur += c);
    else if (c === '"') q = true;
    else if (c === sep) (rows.at(-1).push(cur), (cur = ''));
    else if (c === '\n') (rows.at(-1).push(cur.replace(/\r$/, '')), (cur = ''), rows.push([]));
    else cur += c;
  }
  if (cur || rows.at(-1).length) rows.at(-1).push(cur.replace(/\r$/, ''));
  return rows.filter((r) => r.length > 1);
};

const slugByNum = new Map(pokemon.map((p) => [String(p.id), p.slug]));
const out = {};
const bad = [];
for (const r of parse(text).slice(1)) {
  const value = r[5]?.trim();
  if (!value) continue;
  const key = KEYS[fold(value)];
  const slug = slugByNum.get(r[0].trim());
  if (!key || !slug) bad.push(`${r[0]} ${r[1]}: "${value}"`);
  else out[slug] = key;
}
writeFileSync(new URL('../src/data/rarity.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(Object.keys(out).length, 'rarezas corregidas guardadas en src/data/rarity.json');
if (bad.length) console.warn('No se entendieron (usa Común, Poco común, Rara o Ultra rara):\n' + bad.join('\n'));
