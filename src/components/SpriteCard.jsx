import { useStore } from "../store/useStore";
import { hasFrames } from "../lib/frames";
import { animConfig, fpsOptions } from "../lib/anim";
import CanvasView from "./CanvasView";
import SpritePreview from "./SpritePreview";

const MODES = [
  { id: "animated", label: "Animado" },
  { id: "static", label: "Estático" },
  { id: "raw", label: "Bruto" },
];

export default function SpriteCard({ type, title, sheet, scale, rawScale, labels, hint, compact = false }) {
  const mode = useStore((s) => s.viewModes[type]);
  const setViewMode = useStore((s) => s.setViewMode);
  const fps = useStore((s) => s.fps[type]);
  const setFps = useStore((s) => s.setFps);

  const framed = hasFrames(type);
  const animated = mode === "animated";
  const defaultFps = animConfig(type).fps;

  const fpsSelect = (
    <select value={fps} onChange={(e) => setFps(type, Number(e.target.value))} aria-label="Velocidade (FPS)">
      {fpsOptions(type, fps).map((n) => (
        <option key={n} value={n}>
          {n} FPS{!compact && n === defaultFps ? " (padrão)" : ""}
        </option>
      ))}
    </select>
  );

  return (
    <section className={`card preview ${compact ? "compact" : ""}`}>
      <div className="card-head">
        <h2>{title}</h2>
        {hint && <span className="hint">{hint}</span>}

        {framed && !compact && (
          <div className="tabs">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`tab ${mode === m.id ? "active" : ""}`}
                onClick={() => setViewMode(type, m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {framed && compact && (
          <div className="head-controls">
            <select value={mode} onChange={(e) => setViewMode(type, e.target.value)} aria-label="Modo de visualização">
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            {animated && fpsSelect}
          </div>
        )}
      </div>

      {framed && !compact && animated && (
        <label className="fps">
          Velocidade
          {fpsSelect}
        </label>
      )}

      {!framed || mode === "raw" ? (
        <CanvasView source={sheet} scale={framed ? rawScale : scale} />
      ) : (
        <SpritePreview
          sheet={sheet}
          type={type}
          scale={scale}
          labels={labels}
          fps={fps}
          animate={animated}
        />
      )}
    </section>
  );
}