import { create } from "zustand";
import { manifest, assetsById, categoriesById, slotParent, idsOf, supports, prune, applyPairs, expandSync } from "../data/assets";
import { hslToHex } from "../lib/color";
import { resolveSlot } from "../lib/slots";
import { animConfig } from "../lib/anim";
import { randomizeColors } from "../lib/randomColors";

const initialSelected = {};
manifest.categories.forEach((c) => {
  if (c.multiple) {
    initialSelected[c.id] = [];
    return;
  }
  const first = manifest.assets.find((a) => a.category === c.id);
  initialSelected[c.id] = c.required ? first?.id ?? null : null;
});

const SKIN_TONES = ["#ffe0bd", "#ffcd94", "#eac086", "#c68642", "#8d5524", "#5c3a21"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => min + Math.random() * (max - min);
const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

const snap = (s) => ({ selected: s.selected, colors: s.colors, unlocked: s.unlocked });

let lastKey = null;
let lastTime = 0;
function withHistory(s, key, patch) {
  const now = Date.now();
  const coalesce = key && key === lastKey && now - lastTime < 600;
  lastKey = key;
  lastTime = now;
  return {
    ...patch,
    past: coalesce ? s.past : [...s.past.slice(-49), snap(s)],
    future: [],
  };
}

export const useStore = create((set) => ({
  selected: initialSelected,
  colors: {},
  unlocked: {},
  activeSlot: null,
  activeCategory: manifest.categories[0].id,
  viewModes: Object.fromEntries(Object.keys(manifest.sizes).map((t) => [t, "animated"])), // "animated" | "static" | "raw"
  fps: Object.fromEntries(Object.keys(manifest.sizes).map((t) => [t, animConfig(t).fps])),
  past: [],
  future: [],

  // categoria única: troca a peça. categoria múltipla: equipa/desequipa.
  select: (cat, id) =>
    set((s) => {
      let next;
      let equipped = false;
      if (categoriesById[cat].multiple) {
        const list = idsOf(s.selected[cat]);
        equipped = id !== null && !list.includes(id);
        const updated = id === null ? [] : list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
        next = { ...s.selected, [cat]: updated };
      } else {
        equipped = id !== null;
        next = { ...s.selected, [cat]: id };
      }
      if (equipped) next = applyPairs(next, id);
      return withHistory(s, null, { selected: prune(next) });
    }),

  // move um item na pilha (índice 0 = fundo, último = frente)
  reorderItem: (cat, from, to) =>
    set((s) => {
      const list = [...idsOf(s.selected[cat])];
      if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return s;
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return withHistory(s, null, { selected: { ...s.selected, [cat]: list } });
    }),

  setColor: (slot, hex) =>
    set((s) => {
      const { colors, unlock } = expandSync({ [slot]: hex });
      return withHistory(s, `color:${slot}`, {
        colors: { ...s.colors, ...colors },
        unlocked: unlock.length
          ? { ...s.unlocked, ...Object.fromEntries(unlock.map((k) => [k, true])) }
          : s.unlocked,
      });
    }),

  toggleLock: (slot) =>
    set((s) => {
      if (s.unlocked[slot]) {
        const { [slot]: _c, ...colors } = s.colors;
        const { [slot]: _u, ...unlocked } = s.unlocked;
        return withHistory(s, null, { colors, unlocked });
      }
      return withHistory(s, null, {
        unlocked: { ...s.unlocked, [slot]: true },
        colors: { ...s.colors, [slot]: resolveSlot(slot, s.colors, s.unlocked) },
      });
    }),

  resetSlot: (slot) =>
    set((s) => {
      const { [slot]: _c, ...colors } = s.colors;
      const { [slot]: _u, ...unlocked } = s.unlocked;
      return withHistory(s, null, { colors, unlocked });
    }),

  resetSlots: (slots) =>
    set((s) => {
      const colors = { ...s.colors };
      const unlocked = { ...s.unlocked };
      slots.forEach((k) => {
        delete colors[k];
        delete unlocked[k];
      });
      return withHistory(s, null, { colors, unlocked });
    }),

  resetColors: () => set((s) => withHistory(s, null, { colors: {}, unlocked: {} })),

  applyColors: (newColors, unlockSlots) =>
    set((s) => {
      const { colors, unlock } = expandSync(newColors);
      return withHistory(s, null, {
        colors: { ...s.colors, ...colors },
        unlocked: {
          ...s.unlocked,
          ...Object.fromEntries([...unlockSlots, ...unlock].map((k) => [k, true])),
        },
      });
    }),

  randomize: () =>
    set((s) => {
      const sel = {};
      manifest.categories.forEach((c) => {
        const items = manifest.assets.filter((a) => a.category === c.id && supports(a, sel));
        if (c.multiple) {
          const pool = [...items].sort(() => Math.random() - 0.5);
          const n = Math.floor(Math.random() * (Math.min(3, pool.length) + 1));
          sel[c.id] = pool.slice(0, n).map((a) => a.id);
          return;
        }
        if (!items.length) {
          sel[c.id] = null;
          return;
        }
        const skip = !c.required && Math.random() < 0.15;
        sel[c.id] = skip ? null : pick(items).id;
      });

      // peças pareadas
      manifest.categories.forEach((c) => {
        idsOf(sel[c.id]).forEach((id) => Object.assign(sel, applyPairs(sel, id)));
      });

      const final = prune(sel);
      const { colors, unlocked } = randomizeColors(final, s.colors, s.unlocked);
      return withHistory(s, null, { selected: final, colors, unlocked });
    }),

  loadCharacter: (data) =>
    set((s) => {
      const sel = { ...initialSelected };
      manifest.categories.forEach((c) => {
        const v = data?.selected?.[c.id];
        if (c.multiple) {
          sel[c.id] = idsOf(v).filter(
            (id, i, arr) => assetsById[id]?.category === c.id && arr.indexOf(id) === i
          );
        } else if (v === null && !c.required) sel[c.id] = null;
        else if (assetsById[v]?.category === c.id) sel[c.id] = v;
      });
      const colors = {};
      Object.entries(data?.colors ?? {}).forEach(([k, v]) => {
        if (isHex(v)) colors[k] = v.toLowerCase();
      });
      const unlocked = {};
      Object.keys(data?.unlocked ?? {}).forEach((k) => {
        if (slotParent[k]) unlocked[k] = true;
      });
      return withHistory(s, null, { selected: prune(sel), colors, unlocked });        // loadCharacter
    }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return s;
      lastKey = null;
      const prev = s.past[s.past.length - 1];
      return { ...prev, past: s.past.slice(0, -1), future: [snap(s), ...s.future] };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return s;
      lastKey = null;
      const [next, ...rest] = s.future;
      return { ...next, past: [...s.past, snap(s)], future: rest };
    }),

  setActiveSlot: (slot) => set({ activeSlot: slot }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setViewMode: (type, mode) => set((s) => ({ viewModes: { ...s.viewModes, [type]: mode } })),
  setFps: (type, fps) => set((s) => ({ fps: { ...s.fps, [type]: fps } })),
}));