// Secciones de la portada. `art` = nº de Pokédex usado como ilustración de la tarjeta.
export const sections = [
  {
    slug: 'pokedex',
    title: 'Pokédex y Spawns',
    desc: 'Dónde, cuándo y qué tan común aparece cada Pokémon. Filtra por bioma, rareza, tipo, hora y más.',
    art: 25,
    color: '#f5c518',
  },
  {
    slug: 'crianza',
    title: 'Crianza 6x31',
    desc: 'Checklist paso a paso para criar un Pokémon con IVs perfectos. Tu progreso se guarda.',
    art: 132,
    color: '#e86fd0',
  },
  {
    slug: 'safari',
    title: 'Mapa del Safari',
    desc: 'El mapa completo con las Poképaradas, los entrenadores y los taxis, y sus coordenadas.',
    art: 115,
    color: '#c8d94f',
  },
  {
    slug: 'evoluciones',
    title: 'Evoluciones',
    desc: 'Cadenas evolutivas y cómo cumplir cada requisito: nivel, piedras, amistad, intercambio y más.',
    art: 133,
    color: '#d9a066',
  },
  {
    slug: 'megas',
    title: 'Mega Evoluciones',
    desc: 'Qué Pokémon pueden mega evolucionar, con qué piedra y cómo cambian sus tipos.',
    art: 448,
    color: '#5b8def',
  },
  {
    slug: 'interacciones',
    title: 'Interacciones',
    desc: 'Qué objeto usar sobre cada Pokémon, qué te da a cambio y cuánto hay que esperar.',
    art: 103,
    color: '#4cc46b',
  },
  {
    slug: 'fusiones',
    title: 'Fusiones',
    desc: 'Fusiones exclusivas de Diosesmon: qué Pokémon combinar con la Punta ADN.',
    art: 646,
    color: '#7ad3e8',
  },
];

export const artwork = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
