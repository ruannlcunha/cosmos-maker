import { useEffect, useState } from "react";
import Wheel from "@uiw/react-color-wheel";
import ShadeSlider from "@uiw/react-color-shade-slider";
import { hexToHsva, hsvaToHex, hsvaToRgba } from "@uiw/color-convert";
import { useStore } from "../store/useStore";
import { slotParent } from "../data/assets";
import { resolveSlot } from "../lib/slots";
import { rgbToHex } from "../lib/color";
import PresetSwatches from "./PresetSwatches";

export default function ColorPicker({ slot }) {
  const colors = useStore((s) => s.colors);
  const unlocked = useStore((s) => s.unlocked);
  const setColor = useStore((s) => s.setColor);
  const resetSlot = useStore((s) => s.resetSlot);

  const color = resolveSlot(slot, colors, unlocked);
  const auto = !!slotParent[slot] && !unlocked[slot];

  const [hsva, setHsva] = useState(() => hexToHsva(color));
  const [hexText, setHexText] = useState(color);

  // sincroniza quando a cor muda por fora (troca de slot, sombra automática, desfazer)
  useEffect(() => {
    if (color.toLowerCase() !== hsvaToHex(hsva).toLowerCase()) {
      setHsva(hexToHsva(color));
    }
    setHexText(color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, color]);

  const apply = (next) => {
    const hex = hsvaToHex(next);
    setHsva(next);
    setHexText(hex);
    setColor(slot, hex);
  };

  const rgb = hsvaToRgba(hsva);

  const onRgb = (ch, value) => {
    const v = Math.max(0, Math.min(255, Number(value) || 0));
    const next = { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b), [ch]: v };
    apply(hexToHsva(rgbToHex(next.r, next.g, next.b)));
  };

  const onHex = (value) => {
    setHexText(value);
    const v = value.startsWith("#") ? value : "#" + value;
    if (/^#[0-9a-f]{6}$/i.test(v)) apply(hexToHsva(v));
  };

  return (
    <div className="picker">
      <div className={`picker-body ${auto ? "disabled" : ""}`}>
        <Wheel
          color={hsva}
          width={190}
          height={190}
          onChange={(c) => apply({ ...hsva, h: c.hsva.h, s: c.hsva.s })}
        />
        <ShadeSlider
          hsva={hsva}
          style={{ width: 190, marginTop: 14 }}
          onChange={(shade) => apply({ ...hsva, ...shade })}
        />
      </div>

      {auto && (
        <p className="hint">
          Cor automática, calculada a partir de <b>{slotParent[slot]}</b>. Clique no cadeado para ajustar manualmente.
        </p>
      )}

      {!auto && <PresetSwatches slot={slot} />}

      <div className="inputs"></div>

      <div className="inputs">
        <label className="full">
          HEX
          <input value={hexText} disabled={auto} onChange={(e) => onHex(e.target.value)} maxLength={7} />
        </label>
        {["r", "g", "b"].map((ch) => (
          <label key={ch}>
            {ch.toUpperCase()}
            <input
              type="number"
              min={0}
              max={255}
              disabled={auto}
              value={Math.round(rgb[ch])}
              onChange={(e) => onRgb(ch, e.target.value)}
            />
          </label>
        ))}
      </div>

      <button className="btn small" onClick={() => resetSlot(slot)}>
        Restaurar cor original
      </button>
    </div>
  );
}