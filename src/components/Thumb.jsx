import { useEffect, useRef } from "react";
import { manifest, categoriesById, idsOf, applyPairs, thumbPath } from "../data/assets";
import { useStore } from "../store/useStore";
import { compose } from "../lib/compose";
import { loadThumbImage, recolorLayer } from "../lib/layers";
import { resolveSlot } from "../lib/slots";
import { animConfig } from "../lib/anim";
import { frameInfo, colsOf } from "../lib/frames";

export default function Thumb({ asset }) {
  const ref = useRef(null);
  const selected = useStore((s) => s.selected);
  const colors = useStore((s) => s.colors);
  const unlocked = useStore((s) => s.unlocked);

  const cat = categoriesById[asset.category];
  // tamanho de UM quadro do portrait (ou a imagem inteira, se não tem quadros)
  const fi = frameInfo("portrait");
  const base = fi ? { w: fi.fw, h: fi.fh } : manifest.sizes.portrait;
  const path = thumbPath(asset, selected);

  useEffect(() => {
    let cancelled = false;
    const getColor = (slot) => resolveSlot(slot, colors, unlocked);

    const draw = (source, sx, sy, sw, sh) => {
      const c = ref.current;
      if (!c || cancelled) return;
      c.width = sw;
      c.height = sh;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, sw, sh);
      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    };

    (async () => {
      // 1) miniatura própria da peça (recolorida com a paleta dela)
      if (path) {
        const layer = await loadThumbImage(asset, path);
        if (cancelled) return;
        if (layer) {
          draw(recolorLayer(layer, asset.palette, getColor), 0, 0, layer.w, layer.h);
          return;
        }
      }

      // 2) sem miniatura própria: portrait com a peça equipada
      const sel = cat.multiple
        ? { ...selected, [cat.id]: [...idsOf(selected[cat.id]).filter((x) => x !== asset.id), asset.id] }
        : { ...selected, [cat.id]: asset.id };
      const img = await compose("portrait", applyPairs(sel, asset.id), getColor, () => cancelled);
      if (!img || cancelled) return;

      // portrait com quadros: usa só o quadro estático (padrão: o primeiro)
      const frameX = fi ? animConfig("portrait", colsOf(img, "portrait")).staticFrame * fi.fw : 0;
      const crop = cat.thumb ?? { x: 0, y: 0, w: base.w, h: base.h };
      draw(img, frameX + crop.x, crop.y, crop.w, crop.h);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset, path, selected, colors, unlocked]);

  return <canvas ref={ref} width={base.w} height={base.h} className="pixel thumb-canvas" />;
}