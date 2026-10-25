import { useEffect, useState } from "react";
import { Heart, X, ExternalLink } from "lucide-react";
import credits from "../data/credits.json";

export default function CreditsModal({ inline = false }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button className={inline ? "btn small" : "credits-btn"} onClick={() => setOpen(true)}>
        <Heart size={14} /> Créditos
      </button>

      {open && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="credits-title">
            <div className="modal-head">
              <h2 id="credits-title">Créditos</h2>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <p className="hint left">
              Agradecimentos a quem criou os assets usados neste projeto.
            </p>

            <ul className="credits-list">
              {credits.map((c) => (
                <li key={c.link ?? c.name} className="credit">
                  <div className="credit-name">{c.name}</div>
                  <div className="credit-by">
                    Por: <b>{c.by}</b>
                  </div>
                  {c.note && <div className="credit-note">{c.note}</div>}
                  {c.link && (
                    <a href={c.link} target="_blank" rel="noopener noreferrer">
                      {c.link} <ExternalLink size={12} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}