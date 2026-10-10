import type { IconName } from '../lib/icons';
// Traducciones y colores para los datos de Cobblemon. Si falta una clave se muestra el id "legible" (ver pretty()).

export const pretty = (id: string) =>
  id
    .replace(/^#?[a-z_]+:/, '')
    .replace(/^(is_|has_block\/)/, '')
    .replace(/[_/-]+/g, ' ');

export const label = (map: Record<string, string>, key: string) => map[key] ?? pretty(key);

export const TYPES: Record<string, [string, string]> = {
  normal: ['Normal', '#9fa19f'],
  fire: ['Fuego', '#e62829'],
  water: ['Agua', '#2980ef'],
  electric: ['Eléctrico', '#d9a800'],
  grass: ['Planta', '#3fa129'],
  ice: ['Hielo', '#2fb8dd'],
  fighting: ['Lucha', '#ff8000'],
  poison: ['Veneno', '#9141cb'],
  ground: ['Tierra', '#915121'],
  flying: ['Volador', '#6fa6dc'],
  psychic: ['Psíquico', '#ef4179'],
  bug: ['Bicho', '#91a119'],
  rock: ['Roca', '#a09a6e'],
  ghost: ['Fantasma', '#704170'],
  dragon: ['Dragón', '#5060e1'],
  dark: ['Siniestro', '#624d4e'],
  steel: ['Acero', '#60a1b8'],
  fairy: ['Hada', '#e060e0'],
};

export const EGG: Record<string, string> = {
  monster: 'Monstruo',
  water_1: 'Agua 1',
  water_2: 'Agua 2',
  water_3: 'Agua 3',
  bug: 'Bicho',
  flying: 'Volador',
  field: 'Campo',
  fairy: 'Hada',
  grass: 'Planta',
  human_like: 'Humanoide',
  mineral: 'Mineral',
  amorphous: 'Amorfo',
  ditto: 'Ditto',
  dragon: 'Dragón',
  undiscovered: 'Desconocido',
};

export const BUCKETS: Record<string, [string, string]> = {
  common: ['Común', '#8bc34a'],
  uncommon: ['Poco común', '#29b6f6'],
  rare: ['Raro', '#ab47bc'],
  'ultra-rare': ['Muy raro', '#ffb300'],
  boss: ['Alfa', '#ef5350'],
};

// [nombre, icono (src/lib/icons.ts), ayuda]
export const POSITIONS: Record<string, [string, IconName, string]> = {
  // [nombre, icono, explicación]
  grounded: ['Tierra', 'leaf', 'Aparece caminando sobre bloques sólidos.'],
  surface: ['Superficie del agua', 'wave', 'Aparece nadando sobre la superficie del agua.'],
  submerged: ['Bajo el agua', 'bubbles', 'Aparece sumergido dentro del agua.'],
  seafloor: ['Fondo marino', 'shell', 'Aparece en el fondo del agua (océanos y ríos).'],
  fishing: ['Pesca', 'fish', 'Se obtiene pescando con una Poké Caña.'],
};

export const TIMES: Record<string, string> = { day: 'De día', night: 'De noche', dusk: 'Al atardecer' };

// Fases de luna de Minecraft: 0 = llena … 4 = nueva … 7. Imagen: /img/moon/<n>.webp
export const MOON_PHASES = [
  'Luna llena',
  'Gibosa menguante',
  'Cuarto menguante',
  'Luna menguante',
  'Luna nueva',
  'Luna creciente',
  'Cuarto creciente',
  'Gibosa creciente',
];
// "0", "0,4", "1-3", "1,2,3" → [0], [0,4], [1,2,3]
export const moonPhases = (v: string) =>
  v.split(',').flatMap((p) => {
    const [a, b] = p.split('-').map(Number);
    return b === undefined ? [a] : Array.from({ length: b - a + 1 }, (_, i) => a + i);
  });
export const moonLabel = (v: string) => {
  const ph = moonPhases(v).join(',');
  return (
    { '0': 'Luna llena', '4': 'Luna nueva', '0,4': 'Luna llena o nueva', '1,2,3': 'Luna menguante', '5,6,7': 'Luna creciente' }[ph] ??
    moonPhases(v).map((i) => MOON_PHASES[i]).join(', ')
  );
};

export const NATURES: Record<string, string> = {
  hardy: 'Fuerte', lonely: 'Huraña', brave: 'Audaz', adamant: 'Firme', naughty: 'Pícara', bold: 'Osada',
  docile: 'Dócil', relaxed: 'Plácida', impish: 'Agitada', lax: 'Floja', timid: 'Miedosa', hasty: 'Activa',
  serious: 'Seria', jolly: 'Alegre', naive: 'Ingenua', modest: 'Modesta', mild: 'Afable', quiet: 'Mansa',
  bashful: 'Tímida', rash: 'Alocada', calm: 'Serena', gentle: 'Amable', sassy: 'Grosera', careful: 'Cauta', quirky: 'Rara',
};

export const STATS: Record<string, string> = {
  hp: 'PS', attack: 'Ataque', defence: 'Defensa', special_attack: 'At. Especial', special_defence: 'Def. Especial', speed: 'Velocidad',
};

const REGIONS: Record<string, string> = { alola: 'Alola', galar: 'Galar', hisui: 'Hisui', paldea: 'Paldea' };
// Formas de resultado de evolución: "alolan" → "Forma de Alola", "vivillon_wings=archipelago" → "archipelago"
export const formLabel = (form: string) =>
  form
    .split(' ')
    .map((t) => FORMS[t] ?? pretty(t.split('=').pop()!))
    .join(' · ');
export const biasRegion = (name: string) => REGIONS[name.replace(/-Bias$/, '').toLowerCase()] ?? name;
export const fromFormLabel = (name: string) =>
  name.endsWith('-Bias')
    ? `Con tendencia de ${biasRegion(name)}`
    : REGIONS[name.toLowerCase()]
      ? `Desde la forma de ${REGIONS[name.toLowerCase()]}`
      : `Desde la forma ${pretty(name)}`;

export const CATEGORIES: Record<string, string> = {
  legendary: 'Legendario',
  mythical: 'Singular',
  ultra_beast: 'Ultraente',
  paradox: 'Paradoja',
  starter: 'Inicial',
  fossil: 'Fósil',
  baby: 'Bebé',
};

export const FORMS: Record<string, string> = {
  alolan: 'Forma de Alola',
  galarian: 'Forma de Galar',
  hisuian: 'Forma de Hisui',
  paldean: 'Forma de Paldea',
  valencian: 'Forma de Valencia',
  male: 'Solo macho',
  female: 'Solo hembra',
  frost: 'Rotom Frío',
  wash: 'Rotom Lavado',
  'region_bias=alola': 'Con tendencia de Alola',
  'region_bias=galar': 'Con tendencia de Galar',
  'region_bias=hisui': 'Con tendencia de Hisui',
};

export const PLACES: Record<string, string> = {
  urban: 'Zonas urbanas (cerca de concreto)',
  treetop: 'Sobre árboles',
  foliage: 'Cerca de hojas',
  derelict: 'Cuevas oscuras (sin luz ni cielo)',
  redstone: 'Cerca de redstone',
  lava: 'En lava',
  village: 'Aldea',
  mansion: 'Mansión del bosque',
  shipwreck_cove: 'Cala de naufragio',
  shipwreck: 'Barco hundido',
  cobblemon_ruins: 'Ruinas de Cobblemon',
  trail_ruins: 'Ruinas sospechosas',
  ocean_ruins: 'Ruinas oceánicas',
  ocean_monument: 'Monumento oceánico',
  ruined_portal: 'Portal en ruinas',
  pillager_outpost: 'Puesto de saqueadores',
  illager_structures: 'Estructuras de illagers',
  jungle_pyramid: 'Templo de la jungla',
  desert_pyramid: 'Templo del desierto',
  desert_well: 'Pozo del desierto',
  ancient_city: 'Ciudad antigua',
  igloo: 'Iglú',
  swamp_hut: 'Cabaña de bruja',
  stronghold: 'Fortaleza del End',
  end_city: 'Ciudad del End',
  nether_fossil: 'Fósil del Nether',
  nether_structures: 'Estructuras del Nether',
};

// Grupos de biomas de Cobblemon
export const ZONES: Record<string, string> = {
  '#cobblemon:is_overworld': 'Cualquier bioma del Overworld',
  '#minecraft:is_nether': 'Cualquier bioma del Nether',
  '#cobblemon:is_end': 'El End',
  '#cobblemon:is_jungle': 'Jungla',
  '#cobblemon:is_bamboo': 'Bambú',
  '#cobblemon:is_hills': 'Colinas',
  '#cobblemon:is_mountain': 'Montaña',
  '#cobblemon:is_peak': 'Cumbres',
  '#cobblemon:is_highlands': 'Tierras altas',
  '#cobblemon:is_plateau': 'Meseta',
  '#cobblemon:is_volcanic': 'Volcánico',
  '#cobblemon:is_thermal': 'Termal',
  '#cobblemon:is_freshwater': 'Agua dulce',
  '#cobblemon:is_river': 'Río',
  '#cobblemon:is_temperate': 'Templado',
  '#cobblemon:is_tropical_island': 'Isla tropical',
  '#cobblemon:is_island': 'Isla',
  '#cobblemon:is_floral': 'Floral',
  '#cobblemon:is_forest': 'Bosque',
  '#cobblemon:is_sky': 'Zonas altas (cielo)',
  '#cobblemon:is_grassland': 'Pradera',
  '#cobblemon:is_plains': 'Llanura',
  '#cobblemon:is_shrubland': 'Matorral',
  '#cobblemon:is_spooky': 'Tenebroso',
  '#cobblemon:is_magical': 'Mágico',
  '#cobblemon:is_badlands': 'Badlands',
  '#cobblemon:is_savanna': 'Sabana',
  '#cobblemon:is_arid': 'Árido',
  '#cobblemon:is_desert': 'Desierto',
  '#cobblemon:is_sandy': 'Arenoso',
  '#cobblemon:is_beach': 'Playa',
  '#cobblemon:is_coast': 'Costa',
  '#cobblemon:is_snowy': 'Nevado',
  '#cobblemon:is_snowy_forest': 'Bosque nevado',
  '#cobblemon:is_snowy_taiga': 'Taiga nevada',
  '#cobblemon:is_tundra': 'Tundra',
  '#cobblemon:is_freezing': 'Helado',
  '#cobblemon:is_glacial': 'Glaciar',
  '#cobblemon:is_cold': 'Frío',
  '#cobblemon:is_taiga': 'Taiga',
  '#cobblemon:is_swamp': 'Pantano',
  '#cobblemon:is_lush': 'Cuevas frondosas',
  '#cobblemon:is_dripstone': 'Cuevas kársticas',
  '#cobblemon:is_deep_dark': 'Oscuridad profunda',
  '#cobblemon:is_mushroom': 'Champiñones',
  '#cobblemon:is_cherry_blossom': 'Cerezos',
  '#cobblemon:is_ocean': 'Océano',
  '#cobblemon:is_deep_ocean': 'Océano profundo',
  '#cobblemon:is_warm_ocean': 'Océano cálido',
  '#cobblemon:is_lukewarm_ocean': 'Océano tibio',
  '#cobblemon:is_temperate_ocean': 'Océano templado',
  '#cobblemon:is_cold_ocean': 'Océano frío',
  '#cobblemon:is_frozen_ocean': 'Océano congelado',
  '#cobblemon:has_block/mud': 'Con lodo',
  '#cobblemon:nether/is_basalt': 'Nether: basalto',
  '#cobblemon:nether/is_desert': 'Nether: desierto',
  '#cobblemon:nether/is_fungus': 'Nether: hongos',
  '#cobblemon:nether/is_forest': 'Nether: bosque',
  '#cobblemon:nether/is_crimson': 'Nether: bosque carmesí',
  '#cobblemon:nether/is_warped': 'Nether: bosque distorsionado',
  '#cobblemon:nether/is_overgrowth': 'Nether: vegetación',
  '#cobblemon:nether/is_wasteland': 'Nether: páramo',
  '#cobblemon:nether/is_mountain': 'Nether: montaña',
  '#cobblemon:nether/is_soul_sand': 'Nether: arena de almas',
  '#cobblemon:nether/is_soul_fire': 'Nether: fuego de almas',
  '#cobblemon:nether/is_frozen': 'Nether: helado',
  '#cobblemon:nether/is_quartz': 'Nether: cuarzo',
  '#cobblemon:nether/is_toxic': 'Nether: tóxico',
};

// Nombre de un grupo de biomas, incluidos los de evolución regional ("…/cubone_kantobiome" → "Biomas de Kanto")
export const zoneLabel = (z: string) => {
  if (ZONES[z]) return ZONES[z];
  const region = z.match(/regional\/\w+?_(\w+)biome$/)?.[1];
  if (region) return `Biomas de ${region[0].toUpperCase()}${region.slice(1)}`;
  const vivillon = z.match(/vivillon\/(\w+?)(_anti)?$/)?.[1];
  if (vivillon) return `Biomas del diseño ${pretty(vivillon)}`;
  return pretty(z);
};

// Bloques cercanos (tags); los bloques sueltos se traducen con blocks.json
export const BLOCK_TAGS: Record<string, string> = {
  '#cobblemon:flowers': 'Flores',
  '#cobblemon:red_flowers': 'Flores rojas',
  '#cobblemon:yellow_flowers': 'Flores amarillas',
  '#cobblemon:orange_flowers': 'Flores naranjas',
  '#cobblemon:blue_flowers': 'Flores azules',
  '#cobblemon:white_flowers': 'Flores blancas',
  '#cobblemon:pink_flowers': 'Flores rosas',
  '#cobblemon:apricorns': 'Bonguris',
  '#cobblemon:berries': 'Bayas',
  '#cobblemon:gemstones': 'Gemas',
  '#cobblemon:saccharine_trees': 'Árboles sacarinos',
  '#cobblemon:dead_coral': 'Coral muerto',
  '#minecraft:corals': 'Corales',
  '#minecraft:coral_blocks': 'Bloques de coral',
  '#minecraft:iron_ores': 'Menas de hierro',
  '#minecraft:coal_ores': 'Menas de carbón',
  '#minecraft:diamond_ores': 'Menas de diamante',
  '#minecraft:redstone_ores': 'Menas de redstone',
  '#c:redstone_ores': 'Menas de redstone',
};
