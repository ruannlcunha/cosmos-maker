import { slotDefaults, slotParent } from "../data/assets";
import { hexToHsl, hslToHex } from "./color";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// abaixo disso (em %), o matiz de uma cor quase cinza não é confiável
const ACHROMATIC = 8;

export function resolveSlot(slot, colors, unlocked) {
  const parent = slotParent[slot];

  if (parent && !unlocked[slot]) {
    const base = resolveSlot(parent, colors, unlocked);
    // pai intacto -> usa exatamente a cor original do PNG
    if (base === slotDefaults[parent]) return slotDefaults[slot];

    const p0 = hexToHsl(slotDefaults[parent]);
    const s0 = hexToHsl(slotDefaults[slot]);
    const b = hexToHsl(base);

    // só herda a diferença de matiz se as duas cores originais forem "coloridas"
    const useHue = p0.s >= ACHROMATIC && s0.s >= ACHROMATIC;
    const dh = useHue ? ((s0.h - p0.h + 540) % 360) - 180 : 0;

    return hslToHex({
      h: (b.h + dh + 360) % 360,
      s: clamp(b.s + (s0.s - p0.s), 0, 100),
      l: clamp(b.l + (s0.l - p0.l), 0, 100),
    });
  }

  return colors[slot] ?? slotDefaults[slot];
}