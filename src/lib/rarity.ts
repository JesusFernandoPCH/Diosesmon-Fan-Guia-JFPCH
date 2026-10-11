// Rareza de un Pokémon (la etiqueta de la tarjeta del Pokédex y el ranking de parejas de crianza).
// Las apariciones de cada Pokémon traen su rareza real de Cobblemon (se ven en su ficha); esto resume una sola por especie.
import overrides from '../data/rarity.json' with { type: 'json' };

export const BUCKET_ORDER = ['common', 'uncommon', 'rare', 'ultra-rare', 'boss'];
type Spawny = { spawns: { bucket: string; alpha?: boolean; places?: string[] }[] };

/**
 * La rareza más común entre sus apariciones normales. Cuentan las del mundo y las de aldeas (la única construcción del
 * servidor); no cuentan las de otros lugares (mansión, ruinas…) ni las de alfa: Ralts es Rara y solo es Común dentro de
 * la Mansión del Bosque, que el servidor no tiene.
 */
export function generalRarity(p: Spawny): string | undefined {
  const wild = p.spawns.filter((s) => !s.alpha);
  const open = wild.filter((s) => !s.places?.some((pl) => pl !== 'village'));
  const pool = open.length ? open : wild.length ? wild : p.spawns;
  return pool.map((s) => (s.alpha ? 'boss' : s.bucket)).sort((a, b) => BUCKET_ORDER.indexOf(a) - BUCKET_ORDER.indexOf(b))[0];
}

/** Rareza que muestra la web: la corrección manual de src/data/rarity.json si existe, si no la de Cobblemon. */
export const rarityOf = (p: Spawny & { slug: string }) => (overrides as Record<string, string>)[p.slug] || generalRarity(p);
