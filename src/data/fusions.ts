// Fusiones exclusivas de Diosesmon (lista de https://wiki.diosesmon.net/tutoriales/fusiones).
// Imagen: public/img/fusion/<slug>.webp (o .png), ej. laprasian.webp.
// Datos que da el juego (Pokepad → Fusiones). Mientras estén vacíos/en 0, la web muestra "Datos pendientes".
//   types: ids en inglés → normal, fire, water, grass, electric, ice, fighting, poison, ground, flying,
//          psychic, bug, rock, ghost, dragon, dark, steel, fairy
//   abilities: habilidades normales (en español, como salen en el juego); hidden: la habilidad oculta (en cursiva en el juego)
export interface Fusion {
  slug: string;
  name: string;
  a: string; // slug del Pokémon (como en /pokemon/<slug>/)
  b: string;
  types: string[];
  abilities: string[];
  hidden: string;
  stats: { hp: number; attack: number; defence: number; special_attack: number; special_defence: number; speed: number };
}

export const FUSIONS: Fusion[] = [
  {
    slug: 'laprasian',
    name: 'Laprasian',
    a: 'lapras',
    b: 'persian',
    types: ['water', 'normal'],
    abilities: ['Piel Helada', 'Experto'],
    hidden: 'Pelaje Recio',
    stats: { hp: 95, attack: 75, defence: 65, special_attack: 95, special_defence: 85, speed: 110 },
  },
  {
    slug: 'golenium',
    name: 'Golenium',
    a: 'golem',
    b: 'meganium',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
  {
    slug: 'arcarados',
    name: 'Arcarados',
    a: 'arcanine',
    b: 'gyarados',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
  {
    slug: 'feralimuk',
    name: 'Feralimuk',
    a: 'feraligatr',
    b: 'muk',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
  {
    slug: 'aerotales',
    name: 'Aerotales',
    a: 'aerodactyl',
    b: 'ninetales',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
  {
    slug: 'alakapharos',
    name: 'Alakapharos',
    a: 'alakazam',
    b: 'ampharos',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
  {
    slug: 'steelizard',
    name: 'Steelizard',
    a: 'charizard',
    b: 'steelix',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
  {
    slug: 'genstoise',
    name: 'Genstoise',
    a: 'gengar',
    b: 'blastoise',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
  {
    slug: 'victrosion',
    name: 'Victrosion',
    a: 'victreebel',
    b: 'typhlosion',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
  {
    slug: 'venolax',
    name: 'Venolax',
    a: 'venusaur',
    b: 'snorlax',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
  {
    slug: 'starmonite',
    name: 'Starmonite',
    a: 'starmie',
    b: 'dragonite',
    types: [],
    abilities: [],
    hidden: '',
    stats: { hp: 0, attack: 0, defence: 0, special_attack: 0, special_defence: 0, speed: 0 },
  },
];
