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
// la Ralts base es la del jugador: hembra, y no cuenta como faltante en el inventario
const raltsLeaf = flatten(plan([...STATS])).find((n) => !n.parents && n.species === 'ralts')!;
assert.equal(raltsLeaf.gender, 'F');
assert.ok(!flexFit.gender.has(raltsLeaf.id));

// el IV de la hembra del jugador lo aporta solo ella (×1); los demás se reparten 16/8/4/2/1
{
  const withAtk = buildPlan([...STATS], 'ralts', 0.5, 'slugma', 'F', 'attack');
  const count: Record<string, number> = {};
  for (const n of flatten(withAtk)) if (!n.parents) count[n.stats[0]] = (count[n.stats[0]] ?? 0) + 1;
  assert.equal(count.attack, 1);
  assert.deepEqual(Object.values(count).sort((x, y) => y - x), [16, 8, 4, 2, 1, 1]);
  // el Paso 1 es el cruce de la Ralts del jugador (con su IV) y un Slugma
  const [step1] = flatten(withAtk).filter((n) => n.parents);
  assert.equal(step1.id, 'N2-1');
  assert.equal(step1.species, 'ralts');
  assert.deepEqual(step1.parents![0].stats, ['attack']);
  // y sigue siendo una pirámide válida
  for (const n of flatten(withAtk)) if (n.parents) assert.deepEqual(new Set([...n.parents[0].stats, ...n.parents[1].stats]), new Set(n.stats));
}

// sin género (Magnemite): cría con Ditto, sin pagar géneros
// sin género: hace de hembra (lado izquierdo) y la pareja es un macho de su grupo huevo
const mag = buildPlan(['hp', 'speed'], 'magnemite', -1, 'voltorb', '');
assert.deepEqual(mag.parents!.map((p) => [p.species, p.gender]), [['magnemite', 'N'], ['voltorb', 'M']]);
// solo macho: únicamente con Ditto
const tauros = buildPlan(['hp', 'speed'], 'tauros', 1, '', '');
assert.deepEqual(tauros.parents!.map((p) => [p.species, p.gender]), [['ditto', 'N'], ['tauros', 'M']]);
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
  // espejo: hembra a la izquierda del macho; en llaves, hembra arriba y el objetivo a la derecha
  assert.ok(pos.get(f.id)!.x < pos.get(m.id)!.x);
  const br = layout(ralts, 100, 200, 'bracket');
  assert.ok(br.get(f.id)!.y < br.get(m.id)!.y);
  assert.equal(br.get('N6-1')!.x, 1000);
  // en las parejas de Pokémon base, macho a la izquierda y hembra a la derecha (como en el panel); en llaves, macho arriba
  for (const n of flatten(ralts).filter((x) => x.stats.length === 2)) {
    const [bf, bm] = n.parents!;
    assert.ok(pos.get(bm.id)!.x < pos.get(bf.id)!.x);
    assert.ok(br.get(bm.id)!.y < br.get(bf.id)!.y);
  }
  // el Paso 1 (primera crianza) queda a la izquierda de todos los de su nivel; en llaves, arriba
  // el Paso 1 (la línea de la hembra) queda en el extremo izquierdo y todos van de izquierda a derecha / arriba hacia abajo
  const rest = flatten(ralts).filter((n) => n.stats.length === 2);
  assert.equal(rest[0].species, 'ralts');
  for (let i = 1; i < rest.length; i++) {
    assert.ok(pos.get(rest[i - 1].id)!.x < pos.get(rest[i].id)!.x);
    assert.ok(br.get(rest[i - 1].id)!.y < br.get(rest[i].id)!.y);
  }
  // en ahorro, el huevo al azar se cría antes que el hermano que espera su resultado
  for (const [paidId, randomId] of save.g.waitsFor) assert.ok(Number(randomId.split('-')[1]) < Number(paidId.split('-')[1]));
  console.log('ok reparto y lienzo');
}
