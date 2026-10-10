// Convierte los waypoints de Xaero (minimapa) en src/data/safari.json y en public/safari-waypoints.txt
// (el archivo que los jugadores se descargan para su propio Xaero's Minimap).
// Uso: node scripts/safari-waypoints.mjs "<ruta a mw$default_1.txt>"
// Regla del servidor: p = Poképarada, e = Entrenador, t = Taxi. Se descartan los puntos personales.
import { readFileSync, writeFileSync } from 'node:fs';

const TYPES = { p: 'parada', e: 'entrenador', t: 'taxi' };
const SKIP = new Set(['zona afk']); // personal
const R = 1530; // radio del Safari: lo de fuera no se muestra

const rows = readFileSync(process.argv[2], 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.startsWith('waypoint:'))
  .map((l) => l.split(':'))
  .map(([, name, , x, y, z]) => ({ name: name.trim().toLowerCase(), x: +x, y: +y, z: +z }))
  .filter((w) => !SKIP.has(w.name))
  .map((w) => ({ ...w, type: TYPES[w.name[0]] }))
  .filter((w) => w.type && Math.hypot(w.x, w.z) <= R);

// numerados por cercanía al centro (la ciudad), para poder citarlos: "Poképarada 3"
rows.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
const count = {};
const points = rows.map(({ type, x, y, z }) => ({ type, n: (count[type] = (count[type] ?? 0) + 1), x, y, z }));
writeFileSync(new URL('../src/data/safari.json', import.meta.url), JSON.stringify(points, null, 1) + '\n');
console.log(points.length, 'puntos', count);

// Archivo para el minimapa de los jugadores: mismo formato que mw$default_1.txt (colores de Xaero: 9 azul, 12 rojo, 14 amarillo)
const LOOK = { parada: ['Pokeparada', 'P', 9], entrenador: ['Entrenador', 'E', 12], taxi: ['Taxi', 'T', 14] }; // sin tildes: el archivo no las garantiza
const lines = [
  '#',
  '#waypoint:name:initials:x:y:z:color:disabled:type:set:rotate_on_tp:tp_yaw:visibility_type:destination',
  '#',
  ...points.map((p) => `waypoint:${LOOK[p.type][0]} ${p.n}:${LOOK[p.type][1]}:${p.x}:${p.y}:${p.z}:${LOOK[p.type][2]}:false:0:gui.xaero_default:false:0:0:false`),
];
writeFileSync(new URL('../public/safari-waypoints.txt', import.meta.url), lines.join('\n') + '\n');
