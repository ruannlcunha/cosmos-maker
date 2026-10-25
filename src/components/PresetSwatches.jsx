import palettes from "../data/palettes.json";
import { manifest, groupOfSlot } from "../data/assets";
import { useStore } from "../store/useStore";
import { resolveSlot } from "../lib/slots";
import { presetTargets, presetColors, normHex } from "../lib/presets";

export default function PresetSwatches({ slot }) {
  const selected = useStore((s) => s.selected);
  const colors = useStore((s) => s.colors);
  const unlocked = useStore((s) => s.unlocked);
  const activeCategory = useStore((s) => s.activeCategory);
  const applyColors = useStore((s) => s.applyColors);

  const groupId = groupOfSlot(slot);
  const group = palettes[groupId];
  if (!group?.palettes?.length) return null;

  // peças equipadas: usadas só para marcar o preset ativo
  const equipped = presetTargets(groupId, activeCategory, slot, selected);

  const isActive = (preset) => {
    const entries = Object.entries(presetColors(preset, groupId, equipped, slot).colors);
    return (
      entries.length > 0 &&
      entries.every(([s, hex]) => resolveSlot(s, colors, unlocked).toLowerCase() === hex)
    );
  };

  // ao aplicar, considera TODAS as peças: slots que só existem em algumas peças
  // (ex.: brilho do cabelo) também recebem a cor do preset
  const apply = (preset) => {
    const { colors: map, manual } = presetColors(preset, groupId, manifest.assets, slot);
    applyColors(map, manual);
  };

  return (
    <div className="presets">
      <h3 className="sub">
        {group.label}
        {group.global && <span> (vale para todas as peças)</span>}
      </h3>
      <div className="preset-grid">
        {group.palettes.map((preset, i) => {
          const hexes = Object.keys(preset.colors)
            .sort((a, b) => a - b)
            .map((k) => normHex(preset.colors[k]));
          return (
            <button
              key={`${preset.name}-${i}`}
              className={`preset ${isActive(preset) ? "active" : ""}`}
              title={`${preset.name} · ${hexes.join(" ")}`}
              onClick={() => apply(preset)}
            >
              <span className="preset-strip">
                {hexes.map((h, j) => (
                  <span key={j} style={{ background: h }} />
                ))}
              </span>
              <span className="preset-name">{preset.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}