// Genera los datos de la web a partir de Cobblemon, Minecraft (vanilla) y PokeAPI.
// Uso: npm run data   (añade --fresh para volver a descargar todo)
// Salida: src/data/pokemon.json, src/data/biomes.json, public/img/{art,thumb}/<nº>.webp
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

// Versiones exactas de los mods del servidor Diosesmon (se descargan de Modrinth)
const COBBLEMON_JAR = 'Cobblemon-fabric-1.7.3+1.21.1.jar';
const MEGA_SHOWDOWN_JAR = 'mega_showdown-fabric-1.8.2+1.7.3+1.21.1-hotfix.jar';
const ZAMEGA_JAR = 'zamega-fabric-1.7.3.jar';
const MC_VERSION = '1.21.1';
const FRESH = process.argv.includes('--fresh');
const CACHE = '.cache';
const OUT = 'src/data';
const jarDir = (filename) => join(CACHE, filename.replace(/\.jar$/, ''));
const COBBLEMON_DIR = jarDir(COBBLEMON_JAR);
const DATA = join(COBBLEMON_DIR, 'data/cobblemon');

if (FRESH) rmSync(CACHE, { recursive: true, force: true });

// Descargas con caché
async function cached(name, url, parse = JSON.parse) {
  const path = join(CACHE, name);
  if (!existsSync(path)) {
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  return parse(readFileSync(path, 'utf8'));
}

// Descarga de Modrinth el .jar con ese nombre exacto (el mismo del servidor), verifica su SHA-1
// y extrae solo las rutas indicadas en .cache/<nombre del jar>/
async function modJar(project, filename, paths) {
  const dir = jarDir(filename);
  if (existsSync(join(dir, '.ok'))) return;
  const versions = await fetch(`https://api.modrinth.com/v2/project/${project}/version`).then((r) => r.json());
  const file = versions.flatMap((v) => v.files).find((f) => f.filename === filename);
  if (!file) throw new Error(`No existe ${filename} en Modrinth`);
  console.log(`Descargando ${file.filename} (${Math.round(file.size / 1e6)} MB)…`);
  const buf = Buffer.from(await fetch(file.url).then((r) => r.arrayBuffer()));
  if (createHash('sha1').update(buf).digest('hex') !== file.hashes.sha1) throw new Error(`SHA-1 incorrecto: ${file.filename}`);
  extractZip(buf, dir, paths);
}

function extractZip(buf, dir, paths) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const zip = join(CACHE, 'download.zip');
  writeFileSync(zip, buf);
  // bsdtar (incluido en Windows 10+, macOS) sabe leer .zip/.jar
  const tar = process.platform === 'win32' ? 'C:\\Windows\\System32\\tar.exe' : 'bsdtar';
  execFileSync(tar, ['-xf', zip, '-C', dir, ...paths]);
  rmSync(zip);
  writeFileSync(join(dir, '.ok'), '');
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

// Datos de Cobblemon tal como los ve el servidor: Mega Showdown carga después y reemplaza/añade archivos
// con la misma ruta (especies y spawns).
function overlay(sub) {
  const files = new Map();
  for (const root of [DATA, join(jarDir(MEGA_SHOWDOWN_JAR), 'data/cobblemon')]) {
    if (!existsSync(join(root, sub))) continue;
    for (const { name, data } of jsonFiles(join(root, sub))) {
      const prev = files.get(name);
      // algunos reemplazos no traen "implemented": se conserva el valor original
      if (prev && data.implemented === undefined) data.implemented = prev.implemented;
      files.set(name, data);
    }
  }
  return [...files].map(([name, data]) => ({ name, data }));
}
const jsonFiles = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ name: f.replaceAll('\\', '/').replace('.json', ''), data: readJson(join(dir, f)) }));

// Idioma es_mx de Minecraft y texturas de objetos/bloques vanilla (del cliente oficial de Mojang)
const MC_DIR = join(CACHE, `minecraft-${MC_VERSION}`);
async function minecraftAssets() {
  const manifest = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json').then((r) => r.json());
  const version = await fetch(manifest.versions.find((v) => v.id === MC_VERSION).url).then((r) => r.json());
  if (!existsSync(join(MC_DIR, '.ok'))) {
    console.log('Descargando texturas de Minecraft…');
    const buf = Buffer.from(await fetch(version.downloads.client.url).then((r) => r.arrayBuffer()));
    if (createHash('sha1').update(buf).digest('hex') !== version.downloads.client.sha1) throw new Error('SHA-1 incorrecto: client.jar');
    extractZip(buf, MC_DIR, ['assets/minecraft/textures/item', 'assets/minecraft/textures/block', 'assets/minecraft/textures/environment']);
  }
  const index = await fetch(version.assetIndex.url).then((r) => r.json());
  const { hash } = index.objects['minecraft/lang/es_mx.json'];
  return cached(`mc/es_mx.json`, `https://resources.download.minecraft.net/${hash.slice(0, 2)}/${hash}`);
}

// Nombres en español de especies y movimientos (PokeAPI). Los movimientos se indexan sin guiones
// porque Cobblemon escribe "ancientpower" y PokeAPI "ancient-power".
async function pokeapiNames() {
  const query = `{
    species: pokemon_v2_pokemonspecies { id names: pokemon_v2_pokemonspeciesnames(where:{language_id:{_eq:7}}) { name } }
    moves: pokemon_v2_move { name names: pokemon_v2_movenames(where:{language_id:{_eq:7}}) { name } }
    abilities: pokemon_v2_ability { name names: pokemon_v2_abilitynames(where:{language_id:{_eq:7}}) { name } }
    megas: pokemon_v2_pokemon(where:{name:{_like:"%-mega%"}}) { id name }
  }`;
  const res = await fetch('https://beta.pokeapi.co/graphql/v1beta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`PokeAPI respondió ${res.status}`);
  const { data } = await res.json();
  return {
    species: new Map(data.species.map((s) => [s.id, s.names[0]?.name])),
    moves: new Map(data.moves.map((m) => [m.name.replaceAll('-', ''), m.names[0]?.name])),
    abilities: new Map(data.abilities.map((a) => [a.name.replaceAll('-', ''), a.names[0]?.name])),
    forms: new Map(data.megas.map((p) => [p.name, p.id])), // "charizard-mega-x" → 10034
  };
}

// Biomas: resuelve tags de Cobblemon/Minecraft a biomas vanilla
// ponytail: solo biomas vanilla; los de otros mods (Terralith, BoP, Aether…) se ignoran. Añadir si el servidor los usa.
const tagCache = new Map();
async function resolveTag(id) {
  if (tagCache.has(id)) return tagCache.get(id);
  const [ns, path] = id.split(':');
  let tag = null;
  if (ns === 'cobblemon') {
    const file = join(DATA, 'tags/worldgen/biome', `${path}.json`);
    tag = existsSync(file) ? readJson(file) : null;
  } else if (ns === 'minecraft') {
    tag = await cached(
      `mc/tags/${path}.json`,
      `https://raw.githubusercontent.com/misode/mcmeta/${MC_VERSION}-data/data/minecraft/tags/worldgen/biome/${path}.json`,
    );
  }
  const result = new Set();
  for (const entry of tag?.values ?? []) {
    for (const b of await resolveBiomes([typeof entry === 'string' ? entry : entry.id])) result.add(b);
  }
  tagCache.set(id, result);
  return result;
}

async function resolveBiomes(ids = []) {
  const out = new Set();
  for (const id of ids) {
    if (id.startsWith('#')) (await resolveTag(id.slice(1))).forEach((b) => out.add(b));
    else if (id.startsWith('minecraft:')) out.add(id.slice(10));
  }
  return out;
}

// Spawns
const SPECIAL_PRESETS = new Set([
  'urban', 'treetop', 'foliage', 'derelict', 'redstone', 'lava', 'mansion', 'mansion_bedrooms', 'mansion_dining',
  'ocean_ruins', 'ocean_monument', 'trail_ruins', 'ruined_portal', 'pillager_outpost', 'illager_structures',
  'jungle_pyramid', 'desert_pyramid', 'ancient_city', 'end_city', 'nether_fossil', 'nether_structures', 'stronghold',
]);
const isVanillaZone = (id) => /^#?(minecraft|cobblemon):/.test(id);
// Agrupa las variantes de estructuras en un solo "lugar" (ej. 3 tipos de shipwreck cove → shipwreck_cove)
const placeKey = (structure) => {
  const id = structure.replace('#', '');
  if (id.includes('shipwreck_cove')) return 'shipwreck_cove';
  if (id.startsWith('cobblemon:ruin')) return 'cobblemon_ruins';
  if (id.includes('monument')) return 'ocean_monument';
  return id.split(/[:/]/).pop();
};

async function buildSpawns(biomeIndex) {
  const presets = Object.fromEntries(jsonFiles(join(DATA, 'spawn_detail_presets')).map((p) => [p.name, p.data]));
  const bySpecies = new Map();
  let skipped = 0;

  for (const { data: file } of overlay('spawn_pool_world')) {
    if (file.enabled === false || file.enabled === 'false' || file.neededInstalledMods?.length) continue;
    for (const s of file.spawns) {
      const cond = {};
      const anti = {};
      for (const p of s.presets ?? []) {
        Object.assign(cond, presets[p]?.condition);
        Object.assign(anti, presets[p]?.anticondition);
      }
      Object.assign(cond, s.condition);
      Object.assign(anti, s.anticondition);

      const biomes = cond.biomes ? await resolveBiomes(cond.biomes) : new Set(biomeIndex.keys());
      for (const b of await resolveBiomes(anti.biomes)) biomes.delete(b);
      const idx = [...biomes].map((b) => biomeIndex.get(b)).filter((i) => i !== undefined);
      if (!idx.length) {
        skipped++; // solo aparece en biomas de otros mods
        continue;
      }

      const c = s.condition ?? {};
      // la Caña Amor, la Caña Master y el Confite Amor no están disponibles en el servidor
      if (c.rodType || c.bait) continue;
      const base = {
        pos: s.spawnablePositionType,
        bucket: s.bucket,
        w: s.weight,
        biomes: idx.sort((a, b) => a - b),
        zones: (cond.biomes ?? []).filter(isVanillaZone),
        except: (anti.biomes ?? []).filter(isVanillaZone),
        time: c.timeRange,
        moon: c.moonPhase,
        rain: c.isRaining,
        thunder: c.isThundering,
        sky: c.canSeeSky,
        minY: c.minY,
        maxY: c.maxY,
        places: [
          ...new Set([
            ...(s.presets ?? []).filter((p) => SPECIAL_PRESETS.has(p)).map((p) => (p.startsWith('mansion') ? 'mansion' : p)),
            ...(c.structures ?? []).map(placeKey),
          ]),
        ],
        nearby: c.neededNearbyBlocks,
        snack: c.isPokeSnack,
        lure: c.minLureLevel,
        noLure: s.anticondition?.minLureLevel ? true : undefined,
        slime: c.isSlimeChunk,
      };
      // quita claves vacías para que el JSON pese menos
      for (const k of Object.keys(base)) if (base[k] === undefined || base[k]?.length === 0) delete base[k];

      const members =
        s.type === 'pokemon-herd'
          ? s.herdablePokemon.map((m) => ({ str: m.pokemon, lvl: m.levelRange, herd: true }))
          : [{ str: s.pokemon, lvl: s.level }];
      for (const m of members) {
        const [slug, ...props] = m.str.split(' ');
        const alpha = props.includes('alpha=true');
        const form = props.filter((p) => !p.startsWith('held_item=') && p !== 'alpha=true').join(' ');
        const spawn = { ...base, lvl: m.lvl };
        if (m.herd) spawn.herd = true;
        if (alpha) spawn.alpha = true;
        if (form) spawn.form = form;
        if (!bySpecies.has(slug)) bySpecies.set(slug, []);
        bySpecies.get(slug).push(spawn);
      }
    }
  }
  console.log(`Spawns omitidos (solo biomas de otros mods): ${skipped}`);
  return bySpecies;
}

// Imágenes
async function downloadImages(ids) {
  const queue = ids.filter((id) => !existsSync(`public/img/thumb/${id}.webp`));
  if (!queue.length) return;
  console.log(`Descargando ${queue.length} imágenes…`);
  mkdirSync('public/img/art', { recursive: true });
  mkdirSync('public/img/thumb', { recursive: true });
  const worker = async () => {
    for (let id; (id = queue.shift()); ) {
      const res = await fetch(
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      );
      if (!res.ok) {
        console.warn(`Sin imagen para #${id}`);
        continue;
      }
      const png = Buffer.from(await res.arrayBuffer());
      await sharp(png).resize(320).webp({ quality: 80 }).toFile(`public/img/art/${id}.webp`);
      await sharp(png).resize(96).webp({ quality: 80 }).toFile(`public/img/thumb/${id}.webp`);
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
}

// Imágenes de la Minecraft Wiki (CC BY-NC-SA). `titles`: { clave: "Título de página" } o { clave: "File:..." }.
// Guarda public/img/<dir>/<clave>.webp recortadas a w×h.
async function wikiImages(titles, dir, w, h, pixel = false) {
  mkdirSync(`public/img/${dir}`, { recursive: true });
  const pending = Object.entries(titles).filter(([key]) => !existsSync(`public/img/${dir}/${key}.webp`));
  for (let i = 0; i < pending.length; i += 40) {
    const batch = pending.slice(i, i + 40);
    const isFile = batch[0][1].startsWith('File:');
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      redirects: '1',
      titles: batch.map(([, t]) => t).join('|'),
      ...(isFile
        ? { prop: 'imageinfo', iiprop: 'url', iiurlwidth: String(w * 2) }
        : { prop: 'pageimages', piprop: 'thumbnail', pithumbsize: String(w * 2) }),
    });
    const res = await fetch(`https://minecraft.wiki/api.php?${params}`, {
      headers: { 'User-Agent': 'DiosesmonGuia/1.0 (guia comunitaria; script de datos)' },
    }).then((r) => r.json());
    // sigue normalizaciones y redirecciones para volver al título pedido
    const alias = new Map([...(res.query.normalized ?? []), ...(res.query.redirects ?? [])].map((n) => [n.from, n.to]));
    const final = (t) => (alias.has(t) ? final(alias.get(t)) : t);
    const pages = new Map(Object.values(res.query.pages).map((p) => [p.title, p]));
    for (const [key, title] of batch) {
      const page = pages.get(final(title));
      const info = page?.imageinfo?.[0];
      const url = page?.thumbnail?.source ?? (pixel ? info?.url : info?.thumburl);
      if (!url) {
        console.warn(`Sin imagen en la wiki: ${title}`);
        continue;
      }
      const img = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
      await sharp(img)
        .resize(w, h, pixel ? { fit: 'contain', kernel: 'nearest', background: '#0000' } : { fit: 'cover' })
        .webp(pixel ? { lossless: true } : { quality: 72 })
        .toFile(`public/img/${dir}/${key}.webp`);
    }
  }
}

// Objetos: nombre, icono y cómo conseguirlos
// Mods con objetos propios: carpeta extraída del jar y ruta de sus texturas de objetos
const ITEM_MODS = {
  cobblemon: { dir: COBBLEMON_DIR, tex: 'assets/cobblemon/textures/item' },
  mega_showdown: { dir: jarDir(MEGA_SHOWDOWN_JAR), tex: 'assets/mega_showdown/textures/item' },
  zamega: { dir: jarDir(ZAMEGA_JAR), tex: 'assets/zamega/textures/item' },
};

// Textos de todos los mods (inglés de base, encima español). Quita los códigos de color "§x" de Minecraft.
function modLang() {
  const files = [
    join(COBBLEMON_DIR, 'assets/cobblemon/lang'),
    join(jarDir(MEGA_SHOWDOWN_JAR), 'assets/mega_showdown/lang'),
    join(jarDir(ZAMEGA_JAR), 'assets/cobblemon/lang'),
  ].flatMap((d) => ['en_us.json', 'es_es.json', 'es_mx.json'].map((f) => join(d, f)));
  const out = {};
  for (const f of files) if (existsSync(f)) for (const [k, v] of Object.entries(readJson(f))) out[k] = String(v).replace(/§./g, '');
  return out;
}

function itemTools(lang, cobbleLang) {
  const texIndex = new Map(); // "ns:nombre" → png
  for (const [ns, { dir, tex }] of Object.entries(ITEM_MODS)) {
    const root = join(dir, tex);
    if (!existsSync(root)) continue;
    for (const f of readdirSync(root, { recursive: true })) {
      const key = `${ns}:${f.split(/[\\/]/).pop().replace('.png', '')}`;
      if (f.endsWith('.png') && !texIndex.has(key)) texIndex.set(key, join(root, f));
    }
  }

  const name = (id) => {
    const [ns, path] = id.split(':');
    const src = ns === 'minecraft' ? lang : cobbleLang;
    return src[`item.${ns}.${path}`] ?? src[`block.${ns}.${path}`] ?? path.replace(/_/g, ' ');
  };

  const texture = (id) => {
    const [ns, path] = id.split(':');
    return ns !== 'minecraft'
      ? texIndex.get(id)
      : [`${MC_DIR}/assets/minecraft/textures/item/${path}.png`, `${MC_DIR}/assets/minecraft/textures/block/${path}.png`].find(existsSync);
  };

  // Icono 32×32 en PNG (para dibujar recetas); solo el primer cuadro si es una textura animada
  async function iconPng(id) {
    const file = texture(id);
    if (!file) return null;
    const meta = await sharp(file).metadata();
    return sharp(file)
      .extract({ left: 0, top: 0, width: meta.width, height: Math.min(meta.width, meta.height) })
      .resize(32, 32, { kernel: 'nearest' })
      .png()
      .toBuffer();
  }

  async function icon(id) {
    const [ns, path] = id.split(':');
    const file = texture(id);
    if (!file) return undefined;
    const out = `public/img/item/${ns}_${path}.webp`;
    if (!existsSync(out)) {
      mkdirSync('public/img/item', { recursive: true });
      // pixel art: escala x4 sin suavizar; solo el primer cuadro si es una textura animada
      const meta = await sharp(file).metadata();
      await sharp(file)
        .extract({ left: 0, top: 0, width: meta.width, height: Math.min(meta.width, meta.height) })
        .resize(64, 64, { kernel: 'nearest' })
        .webp({ lossless: true })
        .toFile(out);
    }
    return `/img/item/${ns}_${path}.webp`;
  }

  return { name, icon, iconPng };
}

// tags comunes de recetas → objeto vanilla representativo (para dibujar su icono)
const fromTag = (tag) => {
  const [kind, mat] = tag.split(':')[1].split('/');
  const map = { ingots: `${mat}_ingot`, nuggets: `${mat}_nugget`, gems: mat, dusts: mat, storage_blocks: `${mat}_block` };
  return map[kind] ? `minecraft:${map[kind]}` : null;
};

// Dibuja la receta de crafteo estilo Minecraft (3×3 → resultado) en public/img/recipe/<ns>_<objeto>.webp.
// No reemplaza una imagen que ya exista: así se puede poner a mano la receta propia del servidor.
async function renderRecipe(id, recipe, tools) {
  const [ns, path] = id.split(':');
  const out = `public/img/recipe/${ns}_${path}.webp`;
  if (existsSync(out)) return;
  const cells = recipe.pattern
    ? recipe.pattern.map((row) => row.padEnd(3).split('').map((c) => (c === ' ' ? null : recipe.key[c])))
    : [0, 1, 2].map((r) => [0, 1, 2].map((c) => recipe.ingredients[r * 3 + c] ?? null));
  const S = 36; // tamaño de casilla
  const P = 8;
  const slot = (x, y, size = S) =>
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#8b8b8b" stroke="#373737" stroke-width="2"/>`;
  const img = (buf, x, y) => (buf ? `<image x="${x}" y="${y}" width="32" height="32" href="data:image/png;base64,${buf.toString('base64')}"/>` : '');
  let svg = '';
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const x = P + c * S;
      const y = P + r * S;
      svg += slot(x, y);
      const ing = cells[r]?.[c];
      const one = Array.isArray(ing) ? ing[0] : ing;
      const ingId = one && (one.item ?? fromTag(one.tag ?? ''));
      if (ingId) svg += img(await tools.iconPng(ingId), x + 2, y + 2);
    }
  const ax = P + 3 * S + 10;
  const cy = P + 1.5 * S;
  svg += `<polygon points="${ax},${cy - 6} ${ax + 18},${cy - 6} ${ax + 18},${cy - 12} ${ax + 30},${cy} ${ax + 18},${cy + 12} ${ax + 18},${cy + 6} ${ax},${cy + 6}" fill="#8b8b8b"/>`;
  const rx = ax + 40;
  svg += slot(rx, cy - 22, 44) + img(await tools.iconPng(id), rx + 6, cy - 16);
  const W = rx + 44 + P;
  const H = P * 2 + 3 * S;
  mkdirSync('public/img/recipe', { recursive: true });
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="6" fill="#c6c6c6"/>${svg}</svg>`))
    .webp({ lossless: true })
    .toFile(out);
}

async function buildItems(ids, tools, cobbleLang, speciesFiles, esSpecies, craftable) {
  const modData = (sub) =>
    Object.entries(ITEM_MODS).flatMap(([ns, { dir }]) =>
      existsSync(join(dir, 'data', ns, sub)) ? jsonFiles(join(dir, 'data', ns, sub)).map((r) => ({ ...r, ns })) : [],
    );
  const blockTables = modData('loot_table/blocks');
  const recipes = modData('recipe').map((r) => r.data).filter((r) => r.type?.startsWith('minecraft:crafting'));
  const items = {};
  for (const id of ids) {
    const [ns, path] = id.split(':');
    const desc = [`item.${ns}.${path}.tooltip`, `item.${ns}.${path}.tooltip_2`, `item.${ns}.${path}.tooltip_3`, `tooltip.${ns}.${path}.tooltip`]
      .map((k) => cobbleLang[k])
      .filter(Boolean);
    const item = { es: tools.name(id), icon: await tools.icon(id) };
    if (desc.length) item.desc = desc.join(' ');

    // bloques que al picarlos sueltan el objeto (menas, cristales…), sin contar su propio bloque
    const ores = blockTables
      .filter((t) => t.name !== path && !t.name.endsWith(`${path}_block`) && JSON.stringify(t.data).includes(`"${id}"`))
      .map((t) => tools.name(`${t.ns}:${t.name.split('/').pop()}`));
    if (ores.length) item.ores = ores;

    const drops = [];
    for (const { name, data } of speciesFiles)
      for (const e of data.drops?.entries ?? [])
        if (e.item === id) drops.push({ slug: name.split("/").pop(), es: esSpecies.get(data.nationalPokedexNumber) ?? data.name, pct: e.percentage ?? 100 });
    if (drops.length) item.drops = drops.sort((a, b) => b.pct - a.pct);

    const recipe = recipes.find((r) => r.result?.id === id);
    if (recipe && craftable.has(id)) await renderRecipe(id, recipe, tools);

    items[id] = item;
  }
  return items;
}

// Evoluciones
function buildEvolutions(data, biomeIndex, resolveBiomesSync) {
  const all = [...(data.evolutions ?? []).map((e) => [null, e]), ...(data.forms ?? []).flatMap((f) => (f.evolutions ?? []).map((e) => [f.name, e]))];
  return all.map(([fromForm, e]) => {
    const [to, ...form] = e.result.split(' ');
    const evo = { to, method: e.variant };
    if (form.length) evo.form = form.join(' ');
    if (fromForm) evo.fromForm = fromForm;
    if (e.variant === 'item_interact') evo.item = e.requiredContext;
    if (e.variant === 'trade' && e.requiredContext) evo.tradeWith = e.requiredContext;
    evo.reqs = (e.requirements ?? []).map(({ variant, ...r }) => {
      const req = { t: variant, ...r };
      const tag = r.biomeCondition ?? r.biomeConditions ?? r.biomeAnticondition;
      if (variant === 'biome' && tag) {
        req.anti = !!r.biomeAnticondition;
        req.biomes = [...resolveBiomesSync(tag)].map((b) => biomeIndex.get(b)).filter((i) => i !== undefined).sort((a, b) => a - b);
        req.zone = tag;
      }
      return req;
    });
    return evo;
  });
}

await modJar('cobblemon', COBBLEMON_JAR, ['data/cobblemon', 'assets/cobblemon/lang', 'assets/cobblemon/textures/item']);
await modJar('cobblemon-mega-showdown', MEGA_SHOWDOWN_JAR, ['data', 'assets/mega_showdown/lang', 'assets/mega_showdown/textures/item', 'assets/cobblemon/bedrock/pokemon/resolvers']);
await modJar('navas-zamega', ZAMEGA_JAR, ['data', 'assets/cobblemon/lang', 'assets/zamega/textures/item', 'assets/cobblemon/bedrock/pokemon/resolvers']);
const [lang, names] = await Promise.all([minecraftAssets(), pokeapiNames()]);
const es = names.species;
const cobbleLang = modLang();

const registry = await cached(
  `mc/registries.json`,
  `https://raw.githubusercontent.com/misode/mcmeta/${MC_VERSION}-summary/registries/data.min.json`,
);
const dims = {
  overworld: await resolveTag('minecraft:is_overworld'),
  nether: await resolveTag('minecraft:is_nether'),
  end: await resolveTag('minecraft:is_end'),
};
const biomes = registry['worldgen/biome']
  .filter((id) => id !== 'the_void')
  .map((id) => ({
    id,
    es: lang[`biome.minecraft.${id}`] ?? id,
    dim: Object.keys(dims).find((d) => dims[d].has(id)) ?? 'overworld',
  }))
  .sort((a, b) => a.dim.localeCompare(b.dim) || a.es.localeCompare(b.es, 'es'));
const biomeIndex = new Map(biomes.map((b, i) => [b.id, i]));

const spawns = await buildSpawns(biomeIndex);
const CATEGORIES = ['legendary', 'mythical', 'ultra_beast', 'paradox', 'starter', 'fossil', 'baby'];

// las condiciones de bioma de las evoluciones son tags: se resuelven antes para usarlas de forma síncrona
// Cobblemon marca como "no implementadas" especies sin modelo 3D, pero Mega Showdown/ZA Megas traen el modelo
// de varias (Castform, Darkrai, legendarios…): en el servidor sí existen.
const modelled = new Set();
for (const jar of [MEGA_SHOWDOWN_JAR, ZAMEGA_JAR]) {
  const dir = join(jarDir(jar), 'assets/cobblemon/bedrock/pokemon/resolvers');
  if (existsSync(dir)) for (const { data } of jsonFiles(dir)) if (data.variations?.some((v) => !v.aspects?.length)) modelled.add(data.species.split(':')[1]);
}
const speciesFiles = overlay('species').filter(({ name, data }) => data.implemented || modelled.has(name.split('/').pop()));
const evoTags = new Map();
for (const { data } of speciesFiles)
  for (const e of [...(data.evolutions ?? []), ...(data.forms ?? []).flatMap((f) => f.evolutions ?? [])])
    for (const r of e.requirements ?? []) {
      const tag = r.biomeCondition ?? r.biomeConditions ?? r.biomeAnticondition;
      if (tag && !evoTags.has(tag)) evoTags.set(tag, await resolveBiomes([tag]));
    }

const pokemon = speciesFiles
  .map(({ name, data }) => {
    const slug = name.split('/').pop();
    const gen = data.labels.find((l) => /^gen\d/.test(l)); // gen4, y también gen7b / gen8a (Meltan, Hisui)
    return {
      id: data.nationalPokedexNumber,
      slug,
      en: data.name,
      es: es.get(data.nationalPokedexNumber) ?? data.name,
      types: [data.primaryType, data.secondaryType].filter(Boolean),
      gen: parseInt(gen?.slice(3)),
      egg: data.eggGroups,
      male: data.maleRatio, // -1 = sin género
      cats: data.labels.filter((l) => CATEGORIES.includes(l)),
      catchRate: data.catchRate,
      friendship: data.baseFriendship,
      spawns: spawns.get(slug) ?? [],
      evos: buildEvolutions(data, biomeIndex, (tag) => evoTags.get(tag)),
    };
  })
  .sort((a, b) => a.id - b.id);

const known = new Set(pokemon.map((p) => p.slug));
const orphan = [...spawns.keys()].filter((s) => !known.has(s));
if (orphan.length) console.warn(`Spawns de especies no implementadas: ${orphan.join(', ')}`);

// Nombres en español de bloques/objetos usados en las condiciones (resto: se muestra el id legible)
const blockNames = {};
for (const p of pokemon)
  for (const s of p.spawns)
    for (const b of s.nearby ?? []) {
      const [ns, path] = b.replace('#', '').split(':');
      const name = !b.startsWith('#') && (lang[`block.${ns}.${path}`] ?? lang[`item.${ns}.${path}`]);
      if (name) blockNames[b] = name;
    }

// Objetos que aparecen en evoluciones, spawns y consejos (amistad, intercambio, Poké Snack)
const itemIds = new Set([
  'cobblemon:link_cable', 'cobblemon:poke_snack', 'cobblemon:soothe_bell', 'cobblemon:luxury_ball', 'cobblemon:friend_ball',
  'cobblemon:pomeg_berry', 'cobblemon:kelpsy_berry', 'cobblemon:qualot_berry', 'cobblemon:hondew_berry',
  'cobblemon:grepa_berry', 'cobblemon:tamato_berry', 'cobblemon:rare_candy',
  // crianza: objetos Recios (cada uno asegura un IV) y Lazo Destino
  'cobblemon:power_weight', 'cobblemon:power_bracer', 'cobblemon:power_belt', 'cobblemon:power_lens', 'cobblemon:power_band', 'cobblemon:power_anklet', 'cobblemon:destiny_knot',
]);
const moveIds = new Set();
for (const p of pokemon) {
  for (const s of p.spawns) [s.rod, s.bait].filter(Boolean).forEach((i) => itemIds.add(i));
  for (const e of p.evos) {
    if (e.item) itemIds.add(e.item);
    for (const r of e.reqs) {
      if (r.itemCondition && !r.itemCondition.startsWith('#')) itemIds.add(r.itemCondition);
      if (r.move) moveIds.add(r.move);
    }
  }
}
// Interacciones (clic derecho al Pokémon con un objeto)
// tag del objeto que sostiene el jugador → objeto vanilla para el icono
const TOOL_ITEM = { '#c:tools/brushes': 'minecraft:brush', '#c:fertilizers': 'minecraft:bone_meal', '#c:tools/shear': 'minecraft:shears' };
const interactions = [];
for (const { data } of jsonFiles(join(DATA, 'pokemon_interactions'))) {
  const [slug, ...props] = data.requirements[0].target.split(' ');
  if (!known.has(slug)) continue;
  for (const i of data.interactions) {
    const give = i.effects.find((e) => e.variant === 'drop_item' || e.variant === 'give_item');
    if (!give) continue; // efectos por script (cortes de Furfrou)
    const held = i.requirements.find((r) => r.variant === 'owner_held_item').itemCondition;
    const form = i.requirements.find((r) => r.variant === 'properties')?.target.match(/form=(\S+)/)?.[1];
    const gender = props.find((p) => p.startsWith('gender='))?.split('=')[1];
    interactions.push({
      slug,
      tool: TOOL_ITEM[held] ?? held,
      uses: i.effects.find((e) => e.variant === 'shrink_item')?.amount ?? 1,
      item: give.item,
      amount: String(give.amount ?? 1).replace(/^(\d+)-\1$/, '$1'), // "2-2" → "2"
      cd: Math.round(Number(i.cooldown) / 20), // ticks → segundos
      ...(form && { form }),
      ...(gender && { gender }),
    });
  }
}
// Esquilar (Mareep, Wooloo…) está en el código del mod, no en los datos: especies con el aspecto "sheared"
for (const { name, data } of speciesFiles)
  if (JSON.stringify(data).includes('"sheared"') && known.has(name.split('/').pop()))
    interactions.push({ slug: name.split('/').pop(), tool: 'minecraft:shears', uses: 1, item: 'minecraft:white_wool', amount: '', cd: -1 }); // cd -1 = hasta que le crezca la lana
for (const i of interactions) [i.tool, i.item].forEach((id) => itemIds.add(id));

// Megaevoluciones (Mega Showdown + ZA Megas)
const speciesBySlug = new Map(speciesFiles.map((f) => [f.name.split('/').pop(), f.data]));
// formas extra que los mods añaden a especies existentes (species_additions)
const extraForms = new Map();
for (const dir of [join(DATA, 'species_additions'), join(jarDir(ZAMEGA_JAR), 'data/cobblemon/species_additions')]) {
  if (!existsSync(dir)) continue;
  for (const { data } of jsonFiles(dir)) {
    const slug = data.target.split(':')[1];
    extraForms.set(slug, [...(extraForms.get(slug) ?? []), ...(data.forms ?? [])]);
  }
}
const megaDefs = [
  ...jsonFiles(join(jarDir(MEGA_SHOWDOWN_JAR), 'data/mega_showdown/mega_showdown/mega')).map((f) => ({ ...f, ns: 'mega_showdown', mod: 'Mega Showdown' })),
  ...jsonFiles(join(jarDir(ZAMEGA_JAR), 'data/zamega/mega_showdown/mega')).map((f) => ({ ...f, ns: 'zamega', mod: 'ZA Megas' })),
];
const megas = [];
for (const { name, data, ns, mod } of megaDefs) {
  const aspect = data.aspect_conditions.apply.aspects[0].split('=')[1]; // mega, mega_x, mega_z…
  for (const speciesName of data.pokemons) {
    const slug = speciesName.replace(/-[FM]$/, '').toLowerCase().replace(/[^a-z0-9]/g, ''); // Meowstic-F = misma mega
    if (megas.some((m) => m.slug === slug && m.aspect === aspect)) continue;
    const base = speciesBySlug.get(slug);
    const form = [...(base?.forms ?? []), ...(extraForms.get(slug) ?? [])].find((f) => (f.aspects ?? []).includes(aspect));
    if (!base || !form) {
      console.warn(`Mega sin especie/forma: ${speciesName} (${aspect})`);
      continue;
    }
    // las formas heredan de la especie lo que no definen
    const pick = (k) => (k in form ? form[k] : base[k]);
    megas.push({
      slug,
      stone: `${ns}:${name.split('/').pop()}`,
      aspect,
      form: form.name,
      mod,
      types: [pick('primaryType'), pick('secondaryType')].filter(Boolean),
      stats: pick('baseStats'),
      base: base.baseStats,
      abilities: [...new Set(pick('abilities').map((a) => a.replace(/^h:/, '')))],
    });
  }
}
// Mega Rayquaza no usa piedra: Mega Showdown la activa si conoce Ascenso Draco
const rayquaza = speciesBySlug.get('rayquaza')?.forms?.find((f) => f.aspects?.includes('mega'));
if (rayquaza && !megas.some((m) => m.slug === 'rayquaza')) {
  const base = speciesBySlug.get('rayquaza');
  megas.push({
    slug: 'rayquaza',
    move: names.moves.get('dragonascent') ?? 'Ascenso Draco',
    aspect: 'mega',
    form: rayquaza.name,
    mod: 'Mega Showdown',
    types: [rayquaza.primaryType ?? base.primaryType, 'secondaryType' in rayquaza ? rayquaza.secondaryType : base.secondaryType].filter(Boolean),
    stats: rayquaza.baseStats ?? base.baseStats,
    base: base.baseStats,
    abilities: [...new Set((rayquaza.abilities ?? base.abilities).map((a) => a.replace(/^h:/, '')))],
  });
}
// arte oficial de la mega si PokeAPI lo tiene (las de Z-A aún no): public/img/art/mega/<slug>-<aspecto>.webp
mkdirSync('public/img/art/mega', { recursive: true });
for (const m of megas) {
  const key = `${m.slug}-${m.aspect.replace('_', '-')}`;
  const out = `public/img/art/mega/${key}.webp`;
  const id = names.forms.get(key);
  if (id && !existsSync(out)) {
    const res = await fetch(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`);
    if (res.ok) await sharp(Buffer.from(await res.arrayBuffer())).resize(320).webp({ quality: 80 }).toFile(out);
  }
  if (existsSync(out)) m.art = `/img/art/mega/${key}.webp`;
}
for (const m of megas) if (m.stone) itemIds.add(m.stone);
['mega_showdown:mega_bracelet', 'mega_showdown:keystone', 'mega_showdown:mega_stone'].forEach((i) => itemIds.add(i));
const abilities = Object.fromEntries(megas.flatMap((m) => m.abilities).map((a) => [a, names.abilities.get(a) ?? a]));

const tools = itemTools(lang, cobbleLang);
// En el servidor solo se craftean los objetos equipados de evolución y el Cordón Unión
const craftable = new Set(['cobblemon:link_cable']);
for (const p of pokemon) for (const e of p.evos) for (const r of e.reqs) if (r.t === 'held_item' && !r.itemCondition.startsWith('#')) craftable.add(r.itemCondition);
const items = await buildItems([...itemIds], tools, cobbleLang, speciesFiles, es, craftable);
// PokeAPI aún no tiene el nombre en español de algunos movimientos recientes
const MOVES_ES = { ragefist: 'Puño Furia', twinbeam: 'Rayo Gemelo', hyperdrill: 'Hipertaladro', barbbarrage: 'Mil Púas Tóxicas', psyshieldbash: 'Asalto Barrera' };
const moves = Object.fromEntries([...moveIds].map((m) => [m, names.moves.get(m) ?? MOVES_ES[m] ?? m]));

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'pokemon.json'), JSON.stringify(pokemon));
writeFileSync(join(OUT, 'biomes.json'), JSON.stringify(biomes));
writeFileSync(join(OUT, 'blocks.json'), JSON.stringify(blockNames));
writeFileSync(join(OUT, 'items.json'), JSON.stringify(items));
writeFileSync(join(OUT, 'moves.json'), JSON.stringify(moves));
writeFileSync(join(OUT, 'megas.json'), JSON.stringify(megas));
writeFileSync(join(OUT, 'abilities.json'), JSON.stringify(abilities));
writeFileSync(join(OUT, 'interactions.json'), JSON.stringify(interactions));
const config = readJson(join(DATA, 'spawning/best-spawner-config.json'));
writeFileSync(
  join(OUT, 'meta.json'),
  JSON.stringify({
    cobblemon: COBBLEMON_JAR.match(/-([\d.]+)\+/)[1],
    world: Object.fromEntries(config.buckets.map((b) => [b.name, b.weight])),
  }),
);

// Imágenes
await downloadImages(pokemon.map((p) => p.id));
const titleCase = (id) => id.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
await wikiImages(Object.fromEntries(biomes.map((b) => [b.id, titleCase(b.id)])), 'biome', 320, 180);
await wikiImages(
  {
    village: 'Village', mansion: 'Woodland Mansion', shipwreck: 'Shipwreck', ocean_ruins: 'Ocean Ruin',
    ocean_monument: 'Ocean Monument', ruined_portal: 'Ruined Portal', pillager_outpost: 'Pillager Outpost',
    jungle_pyramid: 'Jungle Pyramid', desert_pyramid: 'Desert Pyramid', desert_well: 'Desert Well',
    ancient_city: 'Ancient City', igloo: 'Igloo', swamp_hut: 'Swamp Hut', stronghold: 'Stronghold', end_city: 'End City',
    nether_fossil: 'Nether Fossil', nether_structures: 'Nether Fortress', trail_ruins: 'Trail Ruins', lava: 'Lava',
    derelict: 'Cave', illager_structures: 'Illager', treetop: 'Tree', foliage: 'Leaves', urban: 'Concrete',
    redstone: 'Redstone Ore',
  },
  'place',
  320,
  180,
);
// Fases de la luna: textura original del juego (4×2 cuadros, índice 0 = luna llena)
mkdirSync('public/img/moon', { recursive: true });
const moonTex = join(MC_DIR, 'assets/minecraft/textures/environment/moon_phases.png');
const { width: mw } = await sharp(moonTex).metadata();
for (let i = 0; i < 8; i++) {
  // cada cuadro trae un halo oscuro; la luna ocupa el centro
  const size = mw / 4;
  const pad = Math.round(size * 0.3);
  await sharp(moonTex)
    .extract({ left: (i % 4) * size + pad, top: Math.floor(i / 4) * size + pad, width: size - 2 * pad, height: size - 2 * pad })
    .resize(64, 64, { kernel: 'nearest' })
    .webp({ lossless: true })
    .toFile(`public/img/moon/${i}.webp`);
}
console.log(
  `OK: ${pokemon.length} Pokémon, ${biomes.length} biomas, ${pokemon.filter((p) => p.spawns.length).length} con spawn, ${Object.keys(items).length} objetos`,
);
