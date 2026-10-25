import palettes from "../data/palettes.json";
import { assetsById, idsOf, presetOf, rootOfSlot } from "../data/assets";

// Garante "#" + minúsculas (tolera "084BA3" sem o "#")
export const normHex = (h) => (h.startsWith("#") ? h : `#${h}`).toLowerCase();

// Peças EQUIPADAS que o preset afeta (usado só para destacar o preset ativo)
export function presetTargets(groupId, activeCategory, activeSlot, selected) {
  if (palettes[groupId]?.global) {
    return Object.values(selected).flatMap(idsOf).map((id) => assetsById[id]).filter(Boolean);
  }
  return idsOf(selected[activeCategory])
    .map((id) => assetsById[id])
    .filter((a) => a && a.palette.some((p) => p.slot === activeSlot));
}

// Converte um preset em { slot: hex } + lista de sombras que passam a ser manuais.
// Grupo global: todas as entradas do grupo. Grupo comum: só a família do slot ativo
// (o slot raiz e as sombras dele).
// Para APLICAR, passe todas as peças do manifest; para destacar, só as equipadas.
export function presetColors(preset, groupId, assets, activeSlot) {
  const global = !!palettes[groupId]?.global;
  const root = rootOfSlot(activeSlot);
  const colors = {};
  const manual = [];
  assets.forEach((a) =>
    a.palette.forEach((p) => {
      const pr = presetOf(p);
      if (!pr || pr.group !== groupId) return;
      if (!global && rootOfSlot(p.slot) !== root) return;
      const hex = preset.colors[pr.id];
      if (!hex) return;
      colors[p.slot] = normHex(hex);
      if (p.parent && !manual.includes(p.slot)) manual.push(p.slot);
    })
  );
  return { colors, manual };
}