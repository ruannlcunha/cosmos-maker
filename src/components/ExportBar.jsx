import { useState } from "react";
import { Image, Package, Film, Archive } from "lucide-react";
import { useStore } from "../store/useStore";
import { manifest } from "../data/assets";
import { frameInfo, hasFrames } from "../lib/frames";
import { downloadCanvas, downloadFramesZip, downloadGif, downloadAll } from "../lib/exportImage";

const IMG_SCALES = [1, 2, 3, 4, 6, 8, 10, 12];
const GIF_SCALES = [1, 2, 3, 4, 5, 6, 8, 10];
const TITLES = { portrait: "Portrait", overworld: "Overworld", battle: "Battle" };
const title = (t) => TITLES[t] ?? t;

export default function ExportBar({ portrait, overworld, battle }) {
  const [scale, setScale] = useState(2);
  const [gifScale, setGifScale] = useState(4);
  const [mime, setMime] = useState("image/png");
  const [dir, setDir] = useState("all");
  const fps = useStore((s) => s.fps);

  const sheets = { portrait, overworld, battle };
  const types = Object.keys(manifest.sizes);
  const animTypes = types.filter(hasFrames);

  const rows = dir === "all" ? null : [Number(dir)];
  const rowsFor = (t) => (t === "overworld" ? rows : null);

  const gifSize = (t) => {
    const fi = frameInfo(t);
    const n = rowsFor(t) ? 1 : fi.rows;
    return `${fi.fw * n * gifScale}×${fi.fh * gifScale}px`;
  };

  const buildAll = () => {
    const { selected, colors, unlocked } = useStore.getState();
    downloadAll({
      sheets, scale, gifScale, mime, fps,
      character: { version: 1, selected, colors, unlocked },
    });
  };

  return (
    <section className="card">
      <h2>Imagens</h2>
      <div className="row">
        <select value={mime} onChange={(e) => setMime(e.target.value)}>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
          <option value="image/jpeg">JPEG</option>
        </select>
        <select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
          {IMG_SCALES.map((n) => (
            <option key={n} value={n}>{n}x</option>
          ))}
        </select>
      </div>

      <div className="export-grid">
        {types.map((t) => (
          <button
            key={t}
            className="btn"
            onClick={() => downloadCanvas(sheets[t], hasFrames(t) ? `${t}_sheet` : t, scale, mime)}
          >
            <Image size={15} /> {title(t)}
          </button>
        ))}
        {animTypes.map((t) => (
          <button key={t} className="btn" onClick={() => downloadFramesZip(sheets[t], t, scale, mime)}>
            <Archive size={15} /> Frames {title(t)}
          </button>
        ))}
      </div>

      {animTypes.length > 0 && (
        <>
          <h2>GIF animado</h2>
          <div className="row">
            {animTypes.includes("overworld") && (
              <select value={dir} onChange={(e) => setDir(e.target.value)}>
                <option value="all">OW: 4 direções</option>
                <option value="0">OW: baixo</option>
                <option value="1">OW: esquerda</option>
                <option value="2">OW: direita</option>
                <option value="3">OW: cima</option>
              </select>
            )}
            <select value={gifScale} onChange={(e) => setGifScale(Number(e.target.value))}>
              {GIF_SCALES.map((n) => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
          </div>
          <p className="hint left">
            {animTypes.map((t) => (
              <span key={t}>
                {title(t)}: {gifSize(t)} · {fps[t]} FPS
                <br />
              </span>
            ))}
            O FPS é o escolhido em cada card.
          </p>
          <div className="export-grid">
            {animTypes.map((t) => (
              <button
                key={t}
                className="btn"
                onClick={() => downloadGif(sheets[t], t, gifScale, rowsFor(t), fps[t])}
              >
                <Film size={15} /> GIF {title(t)}
              </button>
            ))}
          </div>
        </>
      )}

      <button className="btn primary" onClick={buildAll}>
        <Package size={16} /> Baixar tudo (.zip)
      </button>
    </section>
  );
}