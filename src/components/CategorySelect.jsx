import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { manifest, idsOf } from "../data/assets";
import { useStore } from "../store/useStore";

const SEARCH_FROM = 8; // mostra a busca a partir de N categorias

export default function CategorySelect() {
  const active = useStore((s) => s.activeCategory);
  const setActive = useStore((s) => s.setActiveCategory);
  const selected = useStore((s) => s.selected);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  const cats = manifest.categories;
  const current = cats.find((c) => c.id === active);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? cats.filter((c) => c.label.toLowerCase().includes(t)) : cats;
  }, [q, cats]);

  const count = (id) => idsOf(selected[id]).length;

  const choose = (id) => {
    setActive(id);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="catselect" ref={ref}>
      <button className="catselect-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="catselect-label">{current.label}</span>
        <ChevronDown size={16} className={open ? "flip" : ""} />
      </button>

      {open && (
        <div className="catselect-pop">
          {cats.length > SEARCH_FROM && (
            <div className="catselect-search">
              <Search size={14} />
              <input
                autoFocus
                placeholder="Buscar categoria..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}
          <div className="catselect-list">
            {list.map((c) => (
              <button
                key={c.id}
                className={`catselect-item ${c.id === active ? "active" : ""}`}
                onClick={() => choose(c.id)}
              >
                <span className="catselect-label">{c.label}</span>
                {count(c.id) > 0 && <span className="badge">{count(c.id)}</span>}
                {c.id === active && <Check size={14} />}
              </button>
            ))}
            {!list.length && <p className="hint">Nenhuma categoria encontrada.</p>}
          </div>
        </div>
      )}
    </div>
  );
}