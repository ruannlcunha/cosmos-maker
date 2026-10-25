import palettes from "../data/palettes.json";
import config from "../data/random.json";
import {
  manifest, assetsById, idsOf, presetOf, rootOfSlot, slotParent, slotSync, expandSync,
} from "../data/assets";
import { hslToHex } from "./color";

const DEFAULT_HSL = { h: [0, 360], s: [40, 90], l: [30, 65] };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = ([min, max]) => min + Math.random() * (max - min);
const norm = (h) => (h.startsWith("#") ? h : `#${h}`).toLowerCase();
const lower = (list) => (list ?? []).map((n) => String(n).toLowerCase());

// grupo declarado de verdade na peça (sem o "generic" implícito)
function declaredGroup(p) {
  const pr = p?.preset;
  if (!pr) return null;
  return typeof pr === "string" ? pr : pr.group ?? pr.name ?? null;
}

// presets do grupo que o sorteio pode usar
function allowedPresets(groupId, rule) {
  const group = palettes[groupId];
  if (!group?.palettes?.length) return [];
  const groupRule = config.groups?.[groupId] ?? {};
  const only = lower(rule?.only ?? groupRule.only);
  const exclude = new Set([...lower(groupRule.exclude), ...lower(rule?.exclude)]);
  return group.palettes.filter((pl) => {
    const n = pl.name.toLowerCase();
    return (only.length === 0 || only.includes(n)) && !exclude.has(n);
  });
}

// Sorteia as cores das peças equipadas. Devolve { colors, unlocked }.
export function randomizeColors(selected, prevColors, prevUnlocked) {
  const assets = Object.values(selected)
    .flatMap(idsOf)
    .map((id) => assetsById[id])
    .filter(Boolean);

  // entrada de cada slot (a primeira manda) e famílias (raiz -> slots)
  const entries = new Map();
  assets.forEach((a) => a.palette.forEach((p) => !entries.has(p.slot) && entries.set(p.slot, p)));

  const families = new Map();
  entries.forEach((_, slot) => {
    const root = rootOfSlot(slot);
    if (!families.has(root)) families.set(root, []);
    families.get(root).push(slot);
  });

  // slots que recebem a cor de outro por "syncTo" (espelhos) não são sorteados
  const syncTargets = new Set();
  entries.forEach((_, slot) =>
    (slotSync[slot] ?? []).forEach((t) => t !== slot && syncTargets.add(t))
  );

  const colors = {};
  const unlocked = {};
  const globalDraw = {}; // grupo global -> preset sorteado

  // aplica um preset à família, usando o id de cada cor da peça
  const applyPreset = (preset, slots) =>
    slots.forEach((slot) => {
      const hex = preset.colors[presetOf(entries.get(slot))?.id];
      if (!hex) return;
      colors[slot] = norm(hex);
      if (slotParent[slot]) unlocked[slot] = true;
    });

  families.forEach((slots, root) => {
    if (syncTargets.has(root)) return;
    const rule = config.slots?.[root];

    // 1) fixa: mantém o que já está
    if (rule === false) {
      slots.forEach((slot) => {
        if (slot in prevColors) colors[slot] = prevColors[slot];
        if (prevUnlocked[slot]) unlocked[slot] = true;
      });
      return;
    }

    // 2) lista de cores própria
    if (rule?.colors?.length) {
      colors[root] = norm(pick(rule.colors));
      return;
    }

    // 3) conjunto (preset) de uma paleta
    const rootEntry = entries.get(root) ?? entries.get(slots[0]);
    const groupId = rule?.group ?? declaredGroup(rootEntry);
    if (groupId && palettes[groupId]) {
      const global = !!palettes[groupId].global;
      const presets = allowedPresets(groupId, global ? null : rule);
      if (presets.length) {
        const preset = global ? (globalDraw[groupId] ??= pick(presets)) : pick(presets);
        applyPreset(preset, slots);
        return;
      }
    }

    // 4) cor livre
    const hsl = { ...DEFAULT_HSL, ...(config.default?.hsl ?? {}), ...(rule?.hsl ?? {}) };
    colors[root] = hslToHex({ h: rand(hsl.h), s: rand(hsl.s), l: rand(hsl.l) });
  });

  // espelhos (syncTo) recebem a cor da origem
  const synced = expandSync(colors);
  synced.unlock.forEach((k) => (unlocked[k] = true));
  return { colors: synced.colors, unlocked };
}

/* ---------- validação do random.json ---------- */
function validate() {
  const warn = (m) => console.warn(`[random] ${m}`);
  const allSlots = new Set(manifest.assets.flatMap((a) => a.palette.map((p) => p.slot)));
  const groupOfSlot = (slot) => {
    for (const a of manifest.assets) {
      const p = a.palette.find((x) => x.slot === slot);
      if (p) return declaredGroup(p);
    }
    return null;
  };
  const checkNames = (groupId, names, where) =>
    (names ?? []).forEach((n) => {
      if (!palettes[groupId]?.palettes.some((pl) => pl.name.toLowerCase() === String(n).toLowerCase()))
        warn(`${where}: preset "${n}" não existe no grupo "${groupId}"`);
    });

  Object.entries(config.slots ?? {}).forEach(([slot, rule]) => {
    if (!allSlots.has(slot)) return warn(`slot "${slot}" não existe em nenhuma peça`);
    if (slotParent[slot]) warn(`"${slot}" é uma sombra: regras de sorteio valem só para o slot principal`);
    if (rule === false) return;
    if (!rule || typeof rule !== "object") return warn(`slot "${slot}": regra deve ser false ou um objeto`);
    const g = rule.group ?? groupOfSlot(slot);
    if (rule.group && !palettes[rule.group]) warn(`slot "${slot}": grupo "${rule.group}" não existe`);
    if (g && palettes[g]) {
      checkNames(g, rule.only, `slot "${slot}" (only)`);
      checkNames(g, rule.exclude, `slot "${slot}" (exclude)`);
    }
  });

  Object.entries(config.groups ?? {}).forEach(([g, rule]) => {
    if (!palettes[g]) return warn(`grupo "${g}" não existe em palettes.json`);
    checkNames(g, rule?.only, `grupo "${g}" (only)`);
    checkNames(g, rule?.exclude, `grupo "${g}" (exclude)`);
  });
}
validate();