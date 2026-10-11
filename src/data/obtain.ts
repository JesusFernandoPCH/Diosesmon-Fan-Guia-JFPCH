// Cómo se consiguen los objetos EN EL SERVIDOR DIOSESMON.
// Cada objeto puede mostrar: textos propios, las menas que lo dan, los Pokémon que lo sueltan y una imagen de
// receta (public/img/recipe/<mod>_<objeto>.webp, ej. cobblemon_magmarizer.webp; si la imagen no existe no se muestra).
// Objetos sin regla: se muestran menas y Pokémon según los datos de Cobblemon.
import megaData from './megas.json';
import baitData from './baits.json';
import { all, bySlug } from '../lib/evo';
import type { Item, Mega } from './types';
import type { IconName } from '../lib/icons';

export interface Line {
  icon: IconName;
  text: string;
}
export interface How {
  text?: Line[];
  ores?: boolean;
  drops?: boolean;
  recipe?: boolean;
}

/** Megas de Pokémon disponibles en el servidor. */
export const megas = (megaData as Mega[]).filter((m) => bySlug.has(m.slug));

export const megaName = (m: Mega) => {
  const suffix = m.form.replace(/^Mega-?/, '');
  return `Mega ${bySlug.get(m.slug)?.es ?? m.slug}${suffix ? ` ${suffix}` : ''}`;
};

const REWARDS: Line = { icon: 'gift', text: 'Recompensas del servidor (cajas, eventos, misiones).' };
const SHOP: Line = { icon: 'cart', text: 'Tienda del servidor (con Pokédólares).' };

const STONES = ['fire', 'water', 'thunder', 'leaf', 'ice', 'moon', 'sun', 'dawn', 'dusk', 'shiny'].map((s) => `cobblemon:${s}_stone`);

// Objetos que se llevan equipados para evolucionar (Magmatizador, Electrizador…)
const HELD_EVO = new Set(all.flatMap((p) => p.evos.flatMap((e) => e.reqs.filter((r) => r.t === 'held_item').map((r) => r.itemCondition))));

// Objetos propios del servidor (no vienen en ningún mod público). Icono en public/img/item/<mod>_<objeto>.webp
export const CUSTOM_ITEMS: Record<string, Item> = {
  'diosesmon:punta_adn': {
    es: 'Punta ADN',
    icon: '/img/item/diosesmon_punta_adn.webp',
    desc: 'Necesaria para fusionar dos Pokémon. Se gasta una por fusión.',
  },
};

export const OBTAIN: Record<string, How> = {
  'diosesmon:punta_adn': { text: [{ icon: 'hammer', text: 'Se craftea:' }], recipe: true },
  'mega_showdown:mega_bracelet': {
    text: [SHOP, { icon: 'medal', text: 'Recompensa al vencer al 3.er gimnasio (tipo Eléctrico) del Teniente Surge.' }],
  },
  'cobblemon:link_cable': { text: [SHOP, { icon: 'hammer', text: 'Se craftea:' }], recipe: true },
};

// Objetos que recomienda la ayuda de amistad: como en Cobblemon y además en la tienda
const FRIENDSHIP = ['rare_candy', 'soothe_bell', 'luxury_ball', 'friend_ball', 'pomeg_berry', 'kelpsy_berry', 'qualot_berry', 'hondew_berry', 'grepa_berry', 'tamato_berry'].map((i) => `cobblemon:${i}`);

const DEFAULT: How = { ores: true, drops: true, recipe: true };

const BERRY: Line = { icon: 'leaf', text: 'Se cosecha de los árboles de bayas de Cobblemon.' };

export function obtainOf(id: string): How {
  if (OBTAIN[id]) return OBTAIN[id];
  if (STONES.includes(id)) return { ores: true, text: [REWARDS] };
  if (FRIENDSHIP.includes(id)) return { ores: true, drops: true, text: [SHOP] };
  if (id in baitData) return { text: [BERRY] }; // bayas que sirven de cebo para pescar
  if (HELD_EVO.has(id)) return { drops: true, recipe: true };
  const mega = megas.find((m) => m.stone === id);
  if (mega)
    return {
      text: [
        { icon: 'sword', text: `Derrota a un ${megaName(mega)} salvaje (los Megas aparecen al azar en cualquier bioma).` },
        { icon: 'gift', text: 'Al ganarle: 90% de probabilidad de obtener la piedra + 500 Pokédólares.' },
      ],
    };
  return DEFAULT;
}
