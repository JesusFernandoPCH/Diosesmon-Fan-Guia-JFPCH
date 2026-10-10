// Familias evolutivas y agrupación de requisitos, a partir de pokemon.json
import pokemonData from '../data/pokemon.json';
import { ENABLED_GENS } from '../data/config';
import type { Evo, Pokemon } from '../data/types';

/** Pokémon disponibles en el servidor (solo generaciones habilitadas). Usar siempre esta lista. */
export const all = (pokemonData as Pokemon[]).filter((p) => ENABLED_GENS.includes(p.gen));
export const bySlug = new Map(all.map((p) => [p.slug, p]));

// Formas "-Bias" = Pokémon con tendencia regional (nacen en ciertos biomas); se muestran aparte en el árbol.
export const isBias = (e: Evo) => !!e.fromForm?.endsWith('-Bias');
const edges = (p: Pokemon) => p.evos.filter((e) => e.to !== p.slug && bySlug.has(e.to));

const parent = new Map<string, string>();
for (const p of all) for (const e of edges(p)) if (!parent.has(e.to)) parent.set(e.to, p.slug);

export function rootOf(slug: string) {
  const seen = new Set<string>();
  while (parent.has(slug) && !seen.has(slug)) {
    seen.add(slug);
    slug = parent.get(slug)!;
  }
  return slug;
}

/** Una forma de evolucionar ya agrupada: si solo cambia la naturaleza, se juntan en `natures`. */
export interface EvoGroup extends Evo {
  natures?: string[];
}

export function childrenOf(slug: string): { to: string; ways: EvoGroup[] }[] {
  const p = bySlug.get(slug);
  if (!p) return [];
  const byTarget = new Map<string, EvoGroup[]>();
  const merged = new Map<string, EvoGroup>();
  for (const e of edges(p)) {
    const nature = e.reqs.find((r) => r.t === 'properties' && /nature=/.test(r.target))?.target.split('nature=')[1];
    const rest = { ...e, reqs: e.reqs.filter((r) => !(r.t === 'properties' && /nature=/.test(r.target))) };
    const key = JSON.stringify(rest);
    const existing = merged.get(key);
    if (existing) {
      if (nature) existing.natures!.push(nature);
      continue; // duplicada
    }
    const group: EvoGroup = nature ? { ...rest, natures: [nature] } : rest;
    merged.set(key, group);
    if (!byTarget.has(e.to)) byTarget.set(e.to, []);
    byTarget.get(e.to)!.push(group);
  }
  return [...byTarget].map(([to, ways]) => ({ to, ways }));
}

/** Todas las especies de la familia (para buscar y filtrar). */
export function familyMembers(root: string): string[] {
  return [root, ...childrenOf(root).flatMap((c) => familyMembers(c.to))];
}

/** Raíces de las familias que tienen al menos una evolución, en orden de Pokédex. */
export const families = all.filter((p) => !parent.has(p.slug) && childrenOf(p.slug).length).map((p) => p.slug);

// Categorías para el filtro de la página de evoluciones
export const METHOD_TAGS: Record<string, string> = {
  level: 'Nivel',
  item: 'Usar objeto',
  trade: 'Intercambio',
  friendship: 'Amistad',
  held: 'Objeto equipado',
  time: 'Hora del día',
  place: 'Bioma o lugar',
  move: 'Movimiento',
  special: 'Especial',
};

export function methodTags(e: Evo): string[] {
  const tags = new Set<string>();
  if (e.method === 'item_interact') tags.add('item');
  if (e.method === 'trade') tags.add('trade');
  for (const r of e.reqs) {
    const t = {
      level: 'level', friendship: 'friendship', held_item: 'held', time_range: 'time', biome: 'place', structure: 'place',
      has_move: 'move', has_move_type: 'move', use_move: 'move',
    }[r.t as string];
    tags.add(t ?? 'special');
  }
  if (!tags.size) tags.add('level');
  return [...tags];
}
