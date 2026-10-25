import { useRef, useState } from "react";
import { Ban, ChevronUp, ChevronDown, GripVertical, X } from "lucide-react";
import { manifest, assetsById, categoriesById, idsOf, supports } from "../data/assets";
import { useStore } from "../store/useStore";
import Thumb from "./Thumb";
import CategorySelect from "./CategorySelect";

function LayerList({ cat }) {
  const ids = idsOf(useStore((s) => s.selected[cat]));
  const reorder = useStore((s) => s.reorderItem);
  const select = useStore((s) => s.select);
  const dragFrom = useRef(null);
  const [over, setOver] = useState(null);

  if (!ids.length) {
    return <p className="hint">Nenhum item equipado. Clique nas peças acima para equipar quantas quiser.</p>;
  }

  // topo da lista = na frente (último do array)
  const rows = ids.map((id, i) => ({ id, i })).reverse();

  return (
    <div className="layer-list">
      <h3 className="sub">
        Camadas <span>(topo = na frente)</span>
      </h3>
      {rows.map(({ id, i }) => (
        <div
          key={id}
          className={`layer-row ${over === i ? "over" : ""}`}
          draggable
          onDragStart={(e) => {
            dragFrom.current = i;
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(i);
          }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (dragFrom.current !== null) reorder(cat, dragFrom.current, i);
            dragFrom.current = null;
            setOver(null);
          }}
          onDragEnd={() => {
            dragFrom.current = null;
            setOver(null);
          }}
        >
          <GripVertical size={14} className="grip" />
          <span className="layer-name" title={assetsById[id].name}>
            {assetsById[id].name}
          </span>
          <button
            className="icon-btn"
            disabled={i === ids.length - 1}
            onClick={() => reorder(cat, i, i + 1)}
            title="Trazer para frente"
          >
            <ChevronUp size={15} />
          </button>
          <button
            className="icon-btn"
            disabled={i === 0}
            onClick={() => reorder(cat, i, i - 1)}
            title="Enviar para trás"
          >
            <ChevronDown size={15} />
          </button>
          <button className="icon-btn" onClick={() => select(cat, id)} title="Remover">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AssetPicker() {
  const cat = useStore((s) => s.activeCategory);
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);

  const category = categoriesById[cat];
  const multiple = !!category.multiple;
  const ids = idsOf(selected[cat]);
  const items = manifest.assets.filter((a) => a.category === cat && supports(a, selected));

  return (
    <section className="card">
      <h2>Peças</h2>
      <CategorySelect />

      <div className="thumb-grid">
        {items.length === 0 && <p className="hint">Nenhuma peça desta categoria para o corpo escolhido.</p>}
        {(multiple || !category.required) && (
          <button
            className={`thumb ${ids.length === 0 ? "active" : ""}`}
            onClick={() => select(cat, null)}
            title={multiple ? "Remover todos" : "Nenhum"}
          >
            <span className="thumb-none"><Ban size={24} /></span>
            <span className="thumb-label">{multiple ? "Remover todos" : "Nenhum"}</span>
          </button>
        )}
        {items.map((a) => (
          <button
            key={a.id}
            className={`thumb ${ids.includes(a.id) ? "active" : ""}`}
            onClick={() => select(cat, a.id)}
            title={a.name}
          >
            <Thumb asset={a} />
            <span className="thumb-label">{a.name}</span>
          </button>
        ))}
      </div>

      {multiple && <LayerList cat={cat} />}
    </section>
  );
}