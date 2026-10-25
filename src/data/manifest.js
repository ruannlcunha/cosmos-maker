import sizes from "./sizes.json";
import categories from "./categories.json";

const modules = import.meta.glob("./assets/**/*.json", { eager: true });

const catIds = new Set(categories.map((c) => c.id));
const catIndex = Object.fromEntries(categories.map((c, i) => [c.id, i]));
const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
const seen = new Map();
const assets = [];
const warn = (msg) => console.warn(`[manifest] ${msg}`);

Object.keys(modules)
  .sort()
  .forEach((path) => {
    const data = modules[path].default;
    const list = Array.isArray(data) ? data : data?.assets ?? [];
    list.forEach((a) => {
      if (!catIds.has(a.category)) {
        warn(`${path}: "${a.id}" usa categoria desconhecida "${a.category}" (ignorada)`);
        return;
      }
      if (seen.has(a.id)) {
        warn(`id duplicado "${a.id}" em ${path} (já existe em ${seen.get(a.id)}). Ignorada.`);
        return;
      }
      seen.set(a.id, path);
      assets.push(a);
    });
  });

// categorias dependentes
categories.forEach((c) => {
  if (!c.dependsOn) return;
  if (!catIds.has(c.dependsOn)) warn(`categoria "${c.id}": dependsOn "${c.dependsOn}" não existe`);
  else if (catIndex[c.dependsOn] > catIndex[c.id])
    warn(`categoria "${c.dependsOn}" precisa vir ANTES de "${c.id}" em categories.json`);
});

// variants, sprites e src
const byId = Object.fromEntries(assets.map((a) => [a.id, a]));
assets.forEach((a) => {
  const dep = catById[a.category].dependsOn;

  Object.entries(a.pairs ?? {}).forEach(([catId, targetId]) => {
    if (catId === a.category) warn(`"${a.id}": pairs aponta para a própria categoria "${catId}"`);
    if (!catIds.has(catId)) return warn(`"${a.id}": pairs usa categoria desconhecida "${catId}"`);
    const t = byId[targetId];
    if (!t) warn(`"${a.id}": pairs.${catId} aponta para "${targetId}", que não existe`);
    else if (t.category !== catId) warn(`"${a.id}": "${targetId}" é da categoria "${t.category}", não de "${catId}"`);
  });

  if (a.variants && !dep)
    warn(`"${a.id}" tem "variants", mas a categoria "${a.category}" não tem "dependsOn" (variants será ignorado)`);

  a.variants?.forEach((v) => {
    if (!byId[v]) warn(`"${a.id}": variante "${v}" não existe`);
    else if (dep && byId[v].category !== dep)
      warn(`"${a.id}": variante "${v}" é da categoria "${byId[v].category}", mas deveria ser da "${dep}"`);
  });

  Object.entries(a.variantAs ?? {}).forEach(([type, target]) => {
    if (!sizes[type]) warn(`"${a.id}": variantAs.${type} não é um tipo válido`);
    if (!byId[target]) warn(`"${a.id}": variantAs.${type} aponta para "${target}", que não existe`);
  });

  // cada src[tipo] precisa ter um arquivo para cada variante
  const layerDefs = a.layers?.length ? a.layers : [{ name: null, src: a.src }];
  layerDefs.forEach((l) => {
    const label = l.name ? `${a.id} (${l.name})` : a.id;
    Object.entries(l.src ?? {}).forEach(([type, entry]) => {
      if (!sizes[type]) {
        warn(`"${label}": src.${type} não é um tipo válido (${Object.keys(sizes).join(", ")})`);
        return;
      }
      if (typeof entry === "string" || !a.variants || entry["*"]) return;
      a.variants.forEach((v) => {
        const key = byId[v]?.variantAs?.[type] ?? v;
        if (!entry[key]) warn(`"${label}": src.${type} não tem arquivo para o corpo "${key}"`);
      });
    });
  });
});

// slots: conflitos de "parent", pais inexistentes e syncTo inválido
const allSlots = new Set(assets.flatMap((a) => a.palette.map((p) => p.slot)));
const slotParentSeen = {};
const warned = new Set();
const warnOnce = (id, msg) => {
  if (warned.has(id)) return;
  warned.add(id);
  warn(msg);
};

assets.forEach((a) => {
  const own = new Set(a.palette.map((p) => p.slot));
  a.palette.forEach((p) => {
    const prev = slotParentSeen[p.slot];
    if (!prev) slotParentSeen[p.slot] = { parent: p.parent ?? null, asset: a.id };
    else if (prev.parent !== (p.parent ?? null))
      warnOnce(
        `parent:${p.slot}`,
        `slot "${p.slot}" tem "parent" diferente em "${prev.asset}" (${prev.parent ?? "nenhum"}) e em "${a.id}" (${p.parent ?? "nenhum"}). Use nomes de slot diferentes.`
      );

    if (p.parent && !allSlots.has(p.parent))
      warnOnce(`noparent:${p.slot}`, `slot "${p.slot}": parent "${p.parent}" não existe`);

    [].concat(p.syncTo ?? []).forEach((t) => {
      if (own.has(t))
        warnOnce(`syncown:${a.id}:${p.slot}`, `"${a.id}": syncTo de "${p.slot}" aponta para "${t}", que é da própria peça`);
      else if (!allSlots.has(t))
        warnOnce(`syncnone:${p.slot}:${t}`, `"${a.id}": syncTo de "${p.slot}" aponta para "${t}", que não existe em nenhuma peça`);
    });
  });
});

// sizes: frames, sequência, quadro estático e fps
Object.entries(sizes).forEach(([type, sz]) => {
  if (!sz.w || !sz.h) warn(`sizes.${type}: "w" e "h" são obrigatórios`);
  if (sz.fps != null && !(sz.fps > 0)) warn(`sizes.${type}: "fps" deve ser maior que 0`);

  if (!sz.frame) {
    if (sz.sequence || sz.fps != null || sz.staticFrame != null)
      warn(`sizes.${type}: "fps", "sequence" e "staticFrame" são ignorados sem "frame"`);
    return;
  }
  const fw = typeof sz.frame === "number" ? sz.frame : sz.frame.w;
  const fh = typeof sz.frame === "number" ? sz.frame : sz.frame.h;
  if (!fw || !fh) return warn(`sizes.${type}: "frame" deve ser um número ou { "w", "h" }`);

  if (sz.w % fw || sz.h % fh)
    warn(
      `sizes.${type}: ${sz.w}×${sz.h} não é divisível por quadros de ${fw}×${fh}.` +
      (typeof sz.frame === "number"
        ? ` "frame": ${sz.frame} é um quadrado; para quadros retangulares use "frame": { "w": ..., "h": ... }`
        : "")
    );
  const cols = Math.floor(sz.w / fw);
  (sz.sequence ?? []).forEach((c) => {
    if (!Number.isInteger(c) || c < 0 || c >= cols)
      warn(`sizes.${type}: "sequence" tem a coluna ${c}, mas só existem as colunas 0 a ${cols - 1}`);
  });
  if (sz.staticFrame != null && !(sz.staticFrame >= 0 && sz.staticFrame < cols))
    warn(`sizes.${type}: "staticFrame" ${sz.staticFrame} fora das colunas 0 a ${cols - 1}`);
});

// thumbnail: texto ou mapa por corpo
assets.forEach((a) => {
  const t = a.thumbnail;
  if (t == null) return;
  if (typeof t === "string") return;
  if (typeof t !== "object" || Array.isArray(t))
    return warn(`"${a.id}": thumbnail deve ser um caminho (texto) ou um mapa { idDoCorpo: caminho }`);
  Object.keys(t).forEach((k) => {
    if (k !== "*" && !byId[k]) warn(`"${a.id}": thumbnail tem a chave "${k}", que não é uma peça existente`);
  });
});

const manifest = { sizes, categories, assets };
export default manifest;