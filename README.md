# Guía Diosesmon (fan)

Guía comunitaria no oficial de Cobblemon para el servidor **Diosesmon**: Pokédex con spawns, crianza 6x31 paso a paso,
evoluciones, megaevoluciones, interacciones y fusiones. Hecha con [Astro](https://astro.build) (sitio estático).

## Usar

```bash
npm install
npm run dev      # servidor local en http://localhost:4321
npm run build    # genera la web en dist/
npm run preview  # sirve dist/ para revisarla
node src/lib/breeding.test.ts   # prueba del planificador de crianza
```

Requiere Node 22.12 o superior.

## Dónde editar

| Qué | Archivo |
|---|---|
| Generaciones habilitadas en el servidor | `src/data/config.ts` |
| Cómo se consigue cada objeto en el servidor | `src/data/obtain.ts` |
| Fusiones (tipos, habilidades, estadísticas) | `src/data/fusions.ts` |
| Parejas de crianza recomendadas a mano / Pokémon difíciles de encontrar | `src/data/crianza.ts` |
| Imágenes de fusiones | `public/img/fusion/<slug>.webp` |
| Imágenes de recetas | `public/img/recipe/<mod>_<objeto>.webp` |
| Dominio público (vistas previas y mapa del sitio) | `site` en `astro.config.mjs` |

## Datos

`src/data/*.json` y `public/img/` ya vienen generados. Para regenerarlos (al cambiar de versión de Cobblemon o de mods):
`npm run data` (descarga los mods desde Modrinth y PokeAPI; tarda unos minutos).

Pokémon © Nintendo, Game Freak y The Pokémon Company. Datos: Cobblemon, PokeAPI y Minecraft Wiki (CC BY-NC-SA).
