// Forma de los JSON generados por scripts/fetch-data.mjs
export interface Spawn {
  pos: string;
  bucket: string;
  w: number;
  lvl?: string;
  biomes: number[]; // índices de biomes.json
  zones?: string[];
  except?: string[];
  time?: string;
  moon?: string;
  rain?: boolean;
  thunder?: boolean;
  sky?: boolean;
  minY?: number;
  maxY?: number;
  places?: string[];
  nearby?: string[];
  snack?: boolean;
  lure?: number;
  noLure?: boolean;
  slime?: boolean;
  herd?: boolean;
  alpha?: boolean;
  form?: string;
}

export interface EvoReq {
  t: string; // variante de Cobblemon: level, friendship, held_item, biome…
  [k: string]: any;
}

export interface Evo {
  to: string;
  method: 'level_up' | 'item_interact' | 'trade';
  form?: string;
  fromForm?: string;
  item?: string;
  tradeWith?: string;
  reqs: EvoReq[];
}

export interface Item {
  es: string;
  icon?: string;
  desc?: string;
  ores?: string[];
  drops?: { slug: string; es: string; pct: number }[];
}

export interface Pokemon {
  id: number;
  slug: string;
  en: string;
  es: string;
  types: string[];
  gen: number;
  egg: string[];
  male: number;
  cats: string[];
  catchRate: number;
  friendship: number;
  spawns: Spawn[];
  evos: Evo[];
}

export type Stats = Record<'hp' | 'attack' | 'defence' | 'special_attack' | 'special_defence' | 'speed', number>;

export interface Mega {
  slug: string;
  stone?: string; // objeto que debe llevar; Rayquaza no usa piedra
  move?: string; // Rayquaza: movimiento necesario
  aspect: string;
  form: string; // Mega, Mega-X, Mega-Y, Mega-Z
  mod: string;
  types: string[];
  stats: Stats;
  base: Stats;
  abilities: string[];
  art?: string;
}

export interface Biome {
  id: string;
  es: string;
  dim: 'overworld' | 'nether' | 'end';
}

export interface Interaction {
  slug: string;
  tool: string; // objeto que sostiene el jugador
  uses: number; // durabilidad u objetos que gasta
  item: string; // lo que da
  amount: string; // "1", "1-2"; vacío = sin dato
  cd: number; // segundos de espera; 0 = sin espera; -1 = hasta que le crezca la lana
  form?: string;
  gender?: string;
}
