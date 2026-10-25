import { Lock, Unlock } from "lucide-react";
import { assetsById, categoriesById, idsOf, slotParent } from "../data/assets";
import { useStore } from "../store/useStore";
import { resolveSlot } from "../lib/slots";
import ColorPicker from "./ColorPicker";

export default function ColorPanel() {
  const selected = useStore((s) => s.selected);
  const colors = useStore((s) => s.colors);
  const unlocked = useStore((s) => s.unlocked);
  const activeSlot = useStore((s) => s.activeSlot);
  const activeCategory = useStore((s) => s.activeCategory);
  const setActiveSlot = useStore((s) => s.setActiveSlot);
  const toggleLock = useStore((s) => s.toggleLock);
  const resetSlots = useStore((s) => s.resetSlots);

  const category = categoriesById[activeCategory];

  // slots apenas das peças equipadas na categoria atual (sem repetir)
  const seen = new Set();
  const groups = idsOf(selected[activeCategory])
    .map((id) => assetsById[id])
    .filter(Boolean)
    .map((asset) => ({
      asset,
      slots: asset.palette.filter((p) => {
        if (seen.has(p.slot)) return false;
        seen.add(p.slot);
        return true;
      }),
    }))
    .filter((g) => g.slots.length);

  const flat = groups.flatMap((g) => g.slots);
  const current = flat.find((p) => p.slot === activeSlot) ? activeSlot : flat[0]?.slot;

  const renderSlot = (p) => {
    const isChild = !!slotParent[p.slot];
    const locked = isChild && !unlocked[p.slot];
    return (
      <div
        key={p.slot}
        className={`slot ${p.slot === current ? "active" : ""} ${isChild ? "child" : ""}`}
      >
        <button className="slot-main" onClick={() => setActiveSlot(p.slot)}>
          <span className="swatch" style={{ background: resolveSlot(p.slot, colors, unlocked) }} />
          <span className="slot-label">{p.label}</span>
        </button>
        {isChild && (
          <button
            className={`icon-btn ${locked ? "" : "open"}`}
            onClick={() => toggleLock(p.slot)}
            title={locked ? "Automática: clique para ajustar manualmente" : "Manual: clique para voltar ao automático"}
          >
            {locked ? <Lock size={15} /> : <Unlock size={15} />}
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="card">
      <h2>Cores · {category.label}</h2>

      {!flat.length ? (
        <p className="hint">
          Nenhuma peça equipada em <b>{category.label}</b>. Escolha uma peça para editar suas cores.
        </p>
      ) : (
        <>
          <div className="slots">
            {groups.map((g) => (
              <div key={g.asset.id} className="slot-group">
                {category.multiple && <h3 className="sub">{g.asset.name}</h3>}
                {g.slots.map(renderSlot)}
              </div>
            ))}
          </div>

          {current && <ColorPicker slot={current} />}

          <button className="btn" onClick={() => resetSlots(flat.map((p) => p.slot))}>
            Restaurar cores de {category.label}
          </button>
        </>
      )}
    </section>
  );
}