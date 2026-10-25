import { useEffect, useRef } from "react";
import { buildAnimFrames, buildStaticFrame } from "../lib/anim";
import { frameInfo } from "../lib/frames";
import { makeGifBlob, toBlob, openScale } from "../lib/exportImage";
import OpenableImage from "./OpenableImage";

export default function SpritePreview({ sheet, type, scale = 2, labels, fps, animate = true }) {
  const ref = useRef(null);
  const step = useRef(0); // não reinicia a animação quando a cor ou o FPS mudam
  const fi = frameInfo(type);
  const width = fi.fw * fi.rows;

  useEffect(() => {
    if (!sheet || !ref.current) return;
    const frames = animate ? buildAnimFrames(sheet, type) : [buildStaticFrame(sheet, type)];
    const ctx = ref.current.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const draw = () => {
      ctx.clearRect(0, 0, ref.current.width, ref.current.height);
      ctx.drawImage(frames[step.current % frames.length], 0, 0);
      step.current = (step.current + 1) % frames.length;
    };
    draw();

    if (!animate || frames.length < 2) return;
    const id = setInterval(draw, 1000 / fps);
    return () => clearInterval(id);
  }, [sheet, type, animate, fps]);

  // imagem do botão direito: GIF da animação ou PNG do quadro parado
  const makeOpenable = async () => {
    if (!sheet) return null;
    const k = openScale(width, fi.fh, scale);
    if (animate) {
      const frames = buildAnimFrames(sheet, type);
      return frames.length > 1
        ? makeGifBlob(frames, Math.round(1000 / fps), k)
        : toBlob(frames[0], k, "image/png");
    }
    return toBlob(buildStaticFrame(sheet, type), k, "image/png");
  };

  return (
    <div style={{ maxWidth: "100%" }}>
      <div className="canvas-wrap">
        <canvas
          ref={ref}
          width={width}
          height={fi.fh}
          className="pixel checker"
          style={{ width: width * scale, maxWidth: "100%", height: "auto" }}
        />
        <OpenableImage
          make={makeOpenable}
          deps={[sheet, type, animate, fps, scale]}
          title="Botão direito (ou segurar): abrir ou salvar a imagem"
        />
      </div>
      {labels && (
        <div className="walk-labels" style={{ width: width * scale, maxWidth: "100%" }}>
          {labels.map((l) => <span key={l}>{l}</span>)}
        </div>
      )}
    </div>
  );
}