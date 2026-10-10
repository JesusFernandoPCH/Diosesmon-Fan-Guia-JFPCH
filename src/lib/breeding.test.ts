// Prueba del planificador de crianza: node src/lib/breeding.test.ts
import assert from 'node:assert/strict';
import { STATS, bestOrder, buildPlan, costOf, fitInventory, flatten, layout, planGenders, type Inventory } from './breeding.ts';

const both = (s: string) => s !== 'ditto';
const plan = (order: any) => buildPlan(order, 'ralts', 0.5, 'slugma', 'F');

// 6x31 de Ralts con Slugma: 32 capturas, 31 crianzas, 62 Recios
const ralts = plan([...STATS]);
const nodes = flatten(ralts);
assert.equal(nodes.length, 63);
assert.equal(ralts.id, 'N6-1');
for (const n of nodes) {
  if (!n.parents) continue;
  const [f, m] = n.parents;
  // comparten todo menos un IV, cada uno lleva el Recio de su IV distinto, y el hijo es la unión
  assert.equal(f.species, n.species);
  assert.ok(!m.stats.includes(f.item!) && !f.stats.includes(m.item!));
  assert.deepEqual(new Set([...f.stats, ...m.stats]), new Set(n.stats));
}
// solo la línea de la hembra es Ralts: una Ralts por nivel
assert.equal(nodes.filter((n) => n.species === 'ralts').length, 6);
assert.equal(costOf(ralts, 31).total, 62 * 500 + 31 * 500);

// género: 'safe' paga los 30 huevos intermedios (+ el final); 'save' deja al azar uno de cada par de hermanos
const genders = (strategy: 'save' | 'safe', results = {}, inv: Inventory = {}) => {
  const root = plan([...STATS]);
  const fit = fitInventory(root, 'ralts', strategy, inv);
  return { root, fit, g: planGenders(root, { target: 'ralts', strategy, results, final: 'F', both, fit }) };
};
const safe = genders('safe').g;
assert.equal(safe.paid.size, 31);
assert.equal(safe.random.size, 0);
const save = genders('save');
assert.equal(save.g.paid.size, 20); // 11 huevos al azar = 5,500 ₽ menos
assert.equal(save.g.paid.size + save.g.random.size, 31);
// el hermano de un huevo al azar espera su resultado; al anotarlo, toma el género contrario
const [rand] = save.g.random;
const sib = [...save.g.waitsFor].find(([, r]) => r === rand)![0];
assert.equal(flatten(save.root).find((n) => n.id === sib)!.gender, '');
const after = genders('save', { [rand]: 'M' });
assert.equal(flatten(after.root).find((n) => n.id === sib)!.gender, 'F');
assert.equal(flatten(after.root).find((n) => n.id === rand)!.gender, 'M');

// inventario flexible: en 'save' un cruce de base acepta ♂+♀ en cualquier orden
const fixedFit = fitInventory(plan([...STATS]), 'ralts', 'safe', { hp: { m: 16, f: 0 } });
const flexFit = fitInventory(plan([...STATS]), 'ralts', 'save', { hp: { m: 16, f: 0 } });
assert.ok(flexFit.total < fixedFit.total);
// la Ralts base siempre es hembra (línea del objetivo)
const raltsLeaf = flatten(plan([...STATS])).find((n) => !n.parents && n.species === 'ralts')!;
assert.equal(flexFit.gender.get(raltsLeaf.id), 'F');

// sin género (Magnemite): cría con Ditto, sin pagar géneros
const mag = buildPlan(['hp', 'speed'], 'magnemite', -1, '', '');
assert.deepEqual(mag.parents!.map((p) => [p.species, p.gender]), [['ditto', 'N'], ['magnemite', 'N']]);
const magFit = fitInventory(mag, 'magnemite', 'save', {});
assert.equal(planGenders(mag, { target: 'magnemite', strategy: 'save', results: {}, final: '', both: () => false, fit: magFit }).paid.size, 0);
console.log('ok');

// reparto 16/8/4/2/1/1: con muchos Pokémon de Ataque y Velocidad, esos van a las posiciones de 16 y 8
{
  const inv: Inventory = { attack: { m: 8, f: 8 }, speed: { m: 4, f: 4 } };
  const order = bestOrder([...STATS], plan, (root) => fitInventory(root, 'ralts', 'save', inv).total, inv);
  assert.deepEqual(order.slice(0, 2), ['attack', 'speed']);
  // lienzo: hojas arriba (y = 0), objetivo abajo y centrado bajo sus padres
  const pos = layout(ralts, 100, 200);
  assert.equal(pos.get('N1-1')!.y, 0);
  assert.equal(pos.get('N6-1')!.y, 1000);
  const [f, m] = ralts.parents!;
  assert.equal(pos.get('N6-1')!.x, (pos.get(f.id)!.x + pos.get(m.id)!.x) / 2);
  // macho a la izquierda de la hembra; en llaves, macho arriba y el objetivo a la derecha
  assert.ok(pos.get(m.id)!.x < pos.get(f.id)!.x);
  const br = layout(ralts, 100, 200, 'bracket');
  assert.ok(br.get(m.id)!.y < br.get(f.id)!.y);
  assert.equal(br.get('N6-1')!.x, 1000);
  console.log('ok reparto y lienzo');
}
