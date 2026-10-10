// Planificador de crianza por pirámide (reglas de la Guardería de Diosesmon):
// dos padres que comparten todos sus IVs 31 menos uno, cada uno con el objeto Recio de su IV distinto,
// dan un hijo con la unión (1+1 → 2x31, 2+2 → 3x31 … 5+5 → 6x31). La especie la da la hembra (o el que no es Ditto).
// Los padres y sus objetos se pierden en cada crianza.

export const STATS = ['hp', 'attack', 'defence', 'special_attack', 'special_defence', 'speed'] as const;
export type Stat = (typeof STATS)[number];
export type Gender = 'M' | 'F' | 'N' | ''; // '' = al azar

export const ITEM_PRICE = 500;
export const GENDER_PRICE = 500;

export interface Node {
  id: string; // "N2-3" = nivel 2 (2x31), tercero
  stats: Stat[];
  species: string; // slug, o 'ditto'
  gender: Gender;
  item?: Stat; // Recio que lleva cuando hace de padre
  parents?: [Node, Node]; // [hembra (o Ditto), macho]
}

/** Cómo cría la especie objetivo: con pareja de su grupo huevo, o solo con Ditto (sin género / solo machos). */
export type Mode = 'pair' | 'ditto';
export const modeOf = (male: number): Mode => (male < 0 || male === 1 ? 'ditto' : 'pair');
/** Género fijo de la especie: sin género, solo macho o solo hembra; '' si puede ser ambos. */
export const fixedGender = (male: number): Gender => (male < 0 ? 'N' : male === 1 ? 'M' : male === 0 ? 'F' : '');

/**
 * `targetStat`: el IV 31 que ya tiene el Pokémon del jugador con el que empieza la crianza (la hembra a criar, o el
 * macho/sin género si cría con Ditto). Ese IV lo aporta solo él: en la línea principal nunca pasa al otro padre, así
 * que no hacen falta más Pokémon base con ese IV, y los demás se reparten 16/8/4/2/1.
 */
export function buildPlan(stats: Stat[], target: string, targetMale: number, partner: string, finalGender: Gender, targetStat?: Stat): Node {
  const mode = modeOf(targetMale);
  const main = targetStat && stats.includes(targetStat) ? targetStat : undefined;
  const make = (set: Stat[], species: string, gender: Gender, item?: Stat): Node => {
    const node: Node = { id: '', stats: set, species, gender, item };
    // Ditto no se puede criar: si hace falta con varios 31 hay que atraparlo así
    if (set.length === 1 || species === 'ditto') return node;
    let a = set[set.length - 2]; // IV que solo trae la hembra
    let b = set[set.length - 1]; // IV que solo trae el macho
    if (species === target && main && set.includes(main)) {
      // línea principal: el IV del Pokémon del jugador se queda en su lado (hembra, o el que no es Ditto)
      const other = set.filter((s) => s !== main).at(-1)!;
      [a, b] = mode === 'pair' ? [main, other] : [other, main];
    }
    const left = set.filter((s) => s !== b);
    const right = set.filter((s) => s !== a);
    const female = mode === 'ditto' && species === target ? ['ditto', 'N'] : [species, 'F'];
    const male = species === target ? (mode === 'ditto' ? [target, fixedGender(targetMale)] : [partner, 'M']) : [partner, 'M'];
    node.parents = [make(left, female[0], female[1] as Gender, a), make(right, male[0], male[1] as Gender, b)];
    return node;
  };
  const root = make(stats, target, fixedGender(targetMale) || finalGender);
  // nombres por nivel en el orden en que se ven en el lienzo (la hembra va primero: izquierda / arriba),
  // así la línea del Pokémon del jugador y el Paso 1 quedan a la izquierda y los pasos se leen como un libro
  const count: Record<number, number> = {};
  const name = (n: Node) => {
    if (n.parents) visualOrder(n.parents).forEach(name);
    n.id = `N${n.stats.length}-${(count[n.stats.length] = (count[n.stats.length] ?? 0) + 1)}`;
  };
  name(root);
  // el Paso 1 es el cruce del Pokémon del jugador (el primero de la línea principal), aunque en el mapa quede a la derecha
  const lvl2 = flatten(root).filter((n) => n.stats.length === 2 && n.parents);
  const first = lvl2.find((n) => n.species === target);
  if (first) {
    const k = Number(first.id.split('-')[1]);
    for (const n of lvl2) {
      const i = Number(n.id.split('-')[1]);
      if (i < k) n.id = `N2-${i + 1}`;
    }
    first.id = 'N2-1';
  }
  return root;
}

/**
 * Orden en que se dibujan los padres: la hembra primero (así la línea del Pokémon del jugador queda a la izquierda),
 * salvo en las parejas de Pokémon base, donde va macho a la izquierda y hembra a la derecha, como en el panel del paso.
 */
export const visualOrder = ([f, m]: [Node, Node]): Node[] => (!f.parents && !m.parents ? [m, f] : [f, m]);

/** Todos los nodos, de los primeros pasos (capturas) al último (el objetivo). */
export function flatten(root: Node): Node[] {
  const out: Node[] = [];
  const walk = (n: Node) => {
    n.parents?.forEach(walk);
    out.push(n);
  };
  walk(root);
  return out.sort((x, y) => x.stats.length - y.stats.length || Number(x.id.split('-')[1]) - Number(y.id.split('-')[1]));
}

export interface Cost {
  catches: number;
  breeds: number;
  items: Partial<Record<Stat, number>>;
  genders: number;
  total: number;
}

/** Coste aproximado: 2 Recios por crianza + los huevos a los que se les paga el género. */
export function costOf(root: Node, genders: number): Cost {
  const nodes = flatten(root);
  const bred = nodes.filter((n) => n.parents);
  const items: Partial<Record<Stat, number>> = {};
  for (const n of bred) for (const p of n.parents!) items[p.item!] = (items[p.item!] ?? 0) + 1;
  const itemCount = Object.values(items).reduce((a, b) => a + b, 0);
  return {
    catches: nodes.length - bred.length,
    breeds: bred.length,
    items,
    genders,
    total: itemCount * ITEM_PRICE + genders * GENDER_PRICE,
  };
}

// ---------- Pokémon base (1x31) que tiene el jugador ----------
export type Inventory = Partial<Record<Stat, { m: number; f: number }>>;
/**
 * Estrategia de género de los huevos:
 * 'save' (ahorro): en cada par de hermanos que se cruzarán, el primero sale al azar (gratis) y al segundo se le elige
 * el género contrario; los Pokémon base de cada cruce solo tienen que ser un ♂ y una ♀, sin importar el IV.
 * 'safe': se elige el género de todos los huevos desde el principio (más caro, sin esperar resultados).
 * En los dos casos la línea de la especie objetivo se paga, porque la hembra tiene que ser de esa especie.
 */
export type Strategy = 'save' | 'safe';

/** Pareja de Pokémon base que puede repartirse ♂/♀ como convenga (los dos son de la pareja, no del objetivo). */
const flexiblePair = (x: Node, target: string, strategy: Strategy) => {
  const [f, m] = x.parents!;
  return strategy === 'save' && x.species !== target && f.species !== 'ditto' && !f.parents && !m.parents;
};

export interface Fit {
  gender: Map<string, Gender>; // género que le toca a cada Pokémon base
  missing: Partial<Record<Stat, { m: number; f: number; n: number }>>;
  need: Partial<Record<Stat, { m: number; f: number; n: number }>>; // lo que pide cada IV con ese reparto
  total: number; // cuántos faltan en total
}

/** Reparte los Pokémon base del jugador entre los huecos de la pirámide y cuenta los que faltan. */
export function fitInventory(root: Node, target: string, strategy: Strategy, inv: Inventory): Fit {
  const rem: Inventory = {};
  for (const s of STATS) rem[s] = { m: inv[s]?.m ?? 0, f: inv[s]?.f ?? 0 };
  const gender = new Map<string, Gender>();
  const missing: Fit['missing'] = {};
  const need: Fit['need'] = {};
  const take = (leaf: Node, g: Gender) => {
    const s = leaf.stats[0];
    gender.set(leaf.id, g);
    const k = g === 'M' ? 'm' : g === 'F' ? 'f' : 'n';
    (need[s] ??= { m: 0, f: 0, n: 0 })[k]++;
    const r = rem[s]!;
    let ok = false;
    if (k !== 'n' && r[k] > 0) ok = !!r[k]--;
    else if (k === 'n' && r.m + r.f > 0) ok = !!(r.m > 0 ? r.m-- : r.f--); // sin género: sirve cualquiera
    if (!ok) (missing[s] ??= { m: 0, f: 0, n: 0 })[k]++;
  };
  const avail = (leaf: Node, g: 'M' | 'F') => (rem[leaf.stats[0]]![g === 'M' ? 'm' : 'f'] > 0 ? 1 : 0);
  // el Pokémon base de la especie objetivo es el del jugador (el que va a criar): ese ya lo tiene
  const base = flatten(root).filter((n) => !n.parents && n.stats.length === 1 && n.species !== target);
  const pairs = flatten(root).filter((n) => n.parents && flexiblePair(n, target, strategy));
  const inPair = new Set(pairs.flatMap((n) => n.parents!.map((p) => p.id)));
  // primero los de género fijo (línea del objetivo, modo 'safe'), luego los flexibles
  for (const leaf of base) if (!inPair.has(leaf.id) && leaf.gender !== 'N' && leaf.gender) take(leaf, leaf.gender);
  // ponytail: reparto voraz (cruce por cruce, la opción que más aprovecha lo que queda); un óptimo exacto no hace falta aquí
  for (const n of pairs) {
    const [f, m] = n.parents!;
    const swap = avail(f, 'M') + avail(m, 'F') > avail(f, 'F') + avail(m, 'M');
    take(f, swap ? 'M' : 'F');
    take(m, swap ? 'F' : 'M');
  }
  for (const leaf of base) if (!inPair.has(leaf.id) && (leaf.gender === 'N' || !leaf.gender)) take(leaf, 'N');
  const total = Object.values(missing).reduce((t, x) => t + x!.m + x!.f + x!.n, 0);
  return { gender, missing, need, total };
}

export interface GenderPlan {
  paid: Set<string>; // huevos a los que hay que elegirles el género
  random: Set<string>; // huevos que se dejan al azar (gratis): el jugador anota qué salió
  waitsFor: Map<string, string>; // huevo → hermano al azar del que depende su género
}

/**
 * Decide el género de cada huevo según la estrategia y lo que ya salió en los huevos al azar (`results`).
 * Escribe el género en cada nodo ('' = todavía no se sabe) y dice cuáles se pagan.
 */
export function planGenders(
  root: Node,
  o: { target: string; strategy: Strategy; results: Record<string, 'M' | 'F'>; final: Gender; both: (slug: string) => boolean; fit: Fit },
): GenderPlan {
  const paid = new Set<string>();
  const random = new Set<string>();
  const waitsFor = new Map<string, string>();
  const opposite = (g?: Gender): Gender => (g === 'M' ? 'F' : g === 'F' ? 'M' : '');
  for (const n of flatten(root)) if (o.fit.gender.has(n.id) && n.gender !== 'N') n.gender = o.fit.gender.get(n.id)!;
  if (root.parents && o.final && o.both(root.species)) paid.add(root.id);
  for (const x of flatten(root)) {
    if (!x.parents) continue;
    const [f, m] = x.parents;
    if (!f.parents) continue; // Pokémon base: su género sale del reparto del inventario
    if (o.strategy === 'safe' || x.species === o.target || f.species === 'ditto') {
      for (const c of [f, m]) if (c.parents && o.both(c.species)) paid.add(c.id);
      continue;
    }
    // ahorro: el primero que se cría (el de la izquierda / arriba) sale al azar; al hermano se le elige el contrario
    random.add(f.id);
    f.gender = o.results[f.id] ?? '';
    m.gender = opposite(o.results[f.id]);
    if (o.both(m.species)) paid.add(m.id);
    waitsFor.set(m.id, f.id);
  }
  return { paid, random, waitsFor };
}

const permutations = <T,>(list: T[]): T[][] =>
  list.length <= 1 ? [list] : list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p]));

/**
 * Orden de los IVs (el primero lleva más Pokémon: 16, 8, 4, 2, 1, 1) con el que menos le falta al jugador.
 * `plan(order)` arma la pirámide con ese orden y `missing(root)` cuenta cuántos Pokémon base le faltarían.
 */
export function bestOrder(stats: Stat[], plan: (order: Stat[]) => Node, missing: (root: Node) => number, inv: Inventory): Stat[] {
  const size = stats.map((_, i) => 2 ** Math.max(0, stats.length - 2 - i)); // 16, 8, 4, 2, 1, 1
  const have = (s: Stat) => (inv[s]?.m ?? 0) + (inv[s]?.f ?? 0);
  let best = stats;
  let min = [Infinity, 0];
  // ponytail: 720 órdenes como máximo, fuerza bruta basta
  for (const p of permutations(stats)) {
    const miss = missing(plan(p));
    const fit = p.reduce((t, s, i) => t + have(s) * size[i], 0); // desempate: lo que más tienes, en la posición más grande
    if (miss < min[0] || (miss === min[0] && fit > min[1])) [best, min] = [p, [miss, fit]];
  }
  return best;
}

// ---------- posiciones en el lienzo ----------
// 'tree': pirámide invertida (1x31 arriba, objetivo abajo), hembra a la izquierda y macho a la derecha: la línea del
// Pokémon del jugador queda a la izquierda y los pasos van de izquierda a derecha.
// 'bracket': esquema de llaves (1x31 a la izquierda, objetivo a la derecha), hembra arriba y macho abajo.
export type View = 'tree' | 'bracket';

export function layout(root: Node, spread: number, depth: number, view: View = 'tree') {
  const pos = new Map<string, { x: number; y: number }>();
  let leaf = 0;
  const place = (n: Node): number => {
    // parents = [hembra, macho]: la hembra va primero (izquierda / arriba)
    const along = n.parents ? visualOrder(n.parents).map(place).reduce((a, b) => a + b) / 2 : leaf++ * spread;
    const level = (n.stats.length - 1) * depth;
    pos.set(n.id, view === 'tree' ? { x: along, y: level } : { x: level, y: along });
    return along;
  };
  place(root);
  return pos;
}
