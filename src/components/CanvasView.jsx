import { useEffect, useRef } from "react";
import { toBlob, openScale } from "../lib/exportImage";
import OpenableImage from "./OpenableImage";

export default function CanvasView({ source, scale = 1 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!source || !ref.current) return;
    const c = ref.current;
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(source, 0, 0);
  }, [source]);

  const w = source ? source.width * scale : 0;
  return (
    <div className="canvas-wrap">
      <canvas
        ref={ref}
        className="pixel checker"
        style={{ width: w, maxWidth: "100%", height: "auto" }}
      />
      {source && (
        <OpenableImage
          deps={[source, scale]}
          make={() => toBlob(source, openScale(source.width, source.height, scale), "image/png")}
          title="Botão direito (ou segurar): abrir ou salvar a imagem"
        />
      )}
    </div>
  );
}