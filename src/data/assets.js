import manifest from "./manifest.js";

export { manifest };

export const assetsById = Object.fromEntries(manifest.assets.map((a) => [a.id, a]));
export const categoriesById = Object.fromEntries(manifest.categories.map((c) => [c.id, c]));

export const slotDefaults = {};
export const slotParent = {};
export const slotPreset = {}; // slot -> { group, id }
export const slotSync = {}; // slot de origem -> [slots que recebem a mesma cor]

manifest.assets.forEach((a) =>
  a.palette.forEach((p) => {
    if (!slotDefaults[p.slot]) slotDefaults[p.slot] = p.key.toLowerCase();
    if (p.parent) slotParent[p.slot] = p.parent;
    if (p.syncTo) {
      slotSync[p.slot] = [...new Set([...(slotSync[p.slot] ?? []), ...[].concat(p.syncTo)])];
    }
    const pr = presetOf(p);
    if (pr && !slotPreset[p.slot]) slotPreset[p.slot] = pr;
  })
);

export const idsOf = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// Peça compatível com a seleção atual?
export function supports(asset, selected) {
  const dep = categoriesById[asset.category].dependsOn;
  if (!dep || !asset.variants) return true;
  return asset.variants.includes(selected[dep]);
}

// Qual variação usar (ex.: "body_02"), ou null se a peça é universal
export function variantFor(asset, selected) {
  const dep = categoriesById[asset.category].dependsOn;
  return dep && asset.variants ? selected[dep] ?? null : null;
}

// ---------- resolução de arquivos ----------

// Escolhe o caminho dentro de src[type] (string ou mapa por corpo)
function pickPath(src, depAsset, type) {
  const entry = src?.[type];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  const key = depAsset ? depAsset.variantAs?.[type] ?? depAsset.id : null;
  return (key && entry[key]) ?? entry["*"] ?? null;
}

// Convenção antiga, usada só quando a peça não declara src para o tipo
const spriteId = (asset, type) => asset.sprites?.[type] ?? asset.id;

function legacyPath(asset, layerName, depAsset, type) {
  const base = spriteId(asset, type);
  const suffix = depAsset ? `__${spriteId(depAsset, type)}` : "";
  const file = layerName ? `${base}_${layerName}${suffix}` : `${base}${suffix}`;
  return `${type}/${asset.folder ?? asset.category}/${file}.png`;
}

// Camadas de uma peça para um tipo. Cada camada traz o "path" do arquivo
// (relativo a public/assets/) ou null se não houver arquivo definido.
export function getLayers(asset, selected, type) {
  const cat = categoriesById[asset.category];
  const depAsset = cat.dependsOn && asset.variants ? assetsById[selected[cat.dependsOn]] : null;
  const variant = depAsset?.id ?? null;
  const hasLayers = !!asset.layers?.length;
  const defs = hasLayers ? asset.layers : [{ name: null }];

  return defs.map((l) => {
    const src = l.src ?? (hasLayers ? null : asset.src);
    const declared = !!src && Object.prototype.hasOwnProperty.call(src, type);
    const path = declared
      ? pickPath(src, depAsset, type)
      : legacyPath(asset, l.name, depAsset, type);
    return { name: l.name, zIndex: l.zIndex ?? cat.zIndex, path, variant };
  });
}

// Remove da seleção o que não combina mais (ex.: ao trocar o corpo)
export function prune(selected) {
  const out = { ...selected };
  manifest.categories.forEach((cat) => {
    if (!cat.dependsOn) return;
    const v = out[cat.id];
    if (Array.isArray(v)) out[cat.id] = v.filter((id) => supports(assetsById[id], out));
    else if (v && !supports(assetsById[v], out)) out[cat.id] = null;
  });
  return out;
}

// Normaliza o campo "preset" de uma entrada da paleta
export function presetOf(p) {
  const pr = p.preset;
  if (typeof pr === "string") return { group: pr, id: 1 };
  const group = pr?.group ?? pr?.name;
  if (group) return { group, id: pr.id ?? 1 };
  return p.parent ? null : { group: "generic", id: 1 };
}

manifest.assets.forEach((a) =>
  a.palette.forEach((p) => {
    if (!slotDefaults[p.slot]) slotDefaults[p.slot] = p.key.toLowerCase();
    if (p.parent) slotParent[p.slot] = p.parent;
    const pr = presetOf(p);
    if (pr && !slotPreset[p.slot]) slotPreset[p.slot] = pr;
  })
);

// Grupo de preset de um slot (sobe pelos "parent" se o slot não tiver o próprio)
export function groupOfSlot(slot) {
  let s = slot;
  for (let i = 0; i < 10 && s; i++) {
    if (slotPreset[s]) return slotPreset[s].group;
    s = slotParent[s];
  }
  return null;
}
// Equipa as peças ligadas por "pairs" (mão única, sem cascata).
// Em categoria única substitui a peça; em categoria múltipla adiciona se ainda não estiver.
export function applyPairs(selected, assetId) {
  const asset = assetsById[assetId];
  if (!asset?.pairs) return selected;
  const out = { ...selected };
  Object.entries(asset.pairs).forEach(([catId, targetId]) => {
    const cat = categoriesById[catId];
    const target = assetsById[targetId];
    if (!cat || !target || target.category !== catId) return;
    if (cat.multiple) {
      const list = idsOf(out[catId]);
      if (!list.includes(targetId)) out[catId] = [...list, targetId];
    } else {
      out[catId] = targetId;
    }
  });
  return out;
}

// Dado { slot: hex }, acrescenta as cores dos slots ligados por "syncTo".
// Sem cascata, e uma cor definida explicitamente nunca é sobrescrita pela ligação.
export function expandSync(map) {
  const colors = { ...map };
  const unlock = []; // sombras alvo precisam ficar manuais para usar a cor copiada
  Object.entries(map).forEach(([slot, hex]) => {
    (slotSync[slot] ?? []).forEach((t) => {
      if (t in map) return;
      colors[t] = hex;
      if (slotParent[t]) unlock.push(t);
    });
  });
  return { colors, unlock };
}

// Slot raiz de uma cadeia de sombras (pele_sombra_2 -> pele_sombra_1 -> pele)
export function rootOfSlot(slot) {
  let s = slot;
  for (let i = 0; i < 10 && slotParent[s]; i++) s = slotParent[s];
  return s;
}

// Caminho da miniatura própria da peça (ou null para usar o portrait)
export function thumbPath(asset, selected) {
  const t = asset.thumbnail;
  if (!t) return null;
  if (typeof t === "string") return t;
  const cat = categoriesById[asset.category];
  const dep = cat.dependsOn && asset.variants ? assetsById[selected[cat.dependsOn]] : null;
  return (dep && t[dep.id]) || t["*"] || null;
}