import { manifest } from "../data/assets";
import { hexToRgb } from "./color";
import { frameInfo } from "./frames";

const BASE = `${import.meta.env.BASE_URL}assets/`;
const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Lê os pixels e mapeia cada um para o índice da paleta (255 = fora da paleta)
function readLayer(img, w, h, asset, type, cols = 1) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  const base = ctx.getImageData(0, 0, w, h);

  const keyMap = new Map();
  asset.palette.forEach((p, i) => {
    const [r, g, b] = hexToRgb(p.keys?.[type] ?? p.key);
    keyMap.set((r << 16) | (g << 8) | b, i);
  });

  const index = new Uint8Array(w * h).fill(255);
  const d = base.data;
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (d[o + 3] === 0) continue;
    const v = keyMap.get((d[o] << 16) | (d[o + 1] << 8) | d[o + 2]);
    if (v !== undefined) index[i] = v;
  }
  return { w, h, base, index, cols };
}

// Camada de uma peça. Sem caminho ("") ou arquivo inexistente: null (camada vazia).
export function loadLayer(asset, layer, type) {
  const k = `${asset.id}|${layer.name}|${layer.path}|${type}`;
  if (cache.has(k)) return cache.get(k);

  const promise = (async () => {
    if (!layer.path) return null;
    const url = BASE + layer.path;
    let img;
    try {
      img = await loadImage(url);
    } catch {
      console.warn(`[assets] arquivo não encontrado (camada vazia): ${url}`);
      return null;
    }

    const { w, h } = manifest.sizes[type];
    const fi = frameInfo(type);
    let cols = 1;
    let lw = w;

    if (fi) {
      // tipos com quadros: a quantidade de colunas vem da largura do PNG
      cols = Math.max(1, Math.floor(img.naturalWidth / fi.fw));
      lw = cols * fi.fw;
      if (img.naturalWidth % fi.fw)
        console.warn(`[assets] ${url}: largura ${img.naturalWidth}px não é múltiplo da largura do quadro (${fi.fw}px)`);
      if (img.naturalHeight !== h)
        console.warn(`[assets] ${url}: altura ${img.naturalHeight}px, esperado ${h}px`);
    } else if (img.naturalWidth !== w || img.naturalHeight !== h) {
      console.warn(`[assets] ${url}: tamanho ${img.naturalWidth}×${img.naturalHeight}, esperado ${w}×${h}`);
    }

    return readLayer(img, lw, h, asset, type, cols);
  })();

  cache.set(k, promise);
  return promise;
}

// Miniatura própria da peça (tamanho livre). null se não existir.
export function loadThumbImage(asset, path) {
  const k = `thumb|${asset.id}|${path}`;
  if (cache.has(k)) return cache.get(k);

  const promise = (async () => {
    const url = BASE + path;
    let img;
    try {
      img = await loadImage(url);
    } catch {
      console.warn(`[assets] miniatura não encontrada (usando o portrait): ${url}`);
      return null;
    }
    return readLayer(img, img.naturalWidth, img.naturalHeight, asset, "portrait");
  })();

  cache.set(k, promise);
  return promise;
}

export function recolorLayer(layer, palette, getColor) {
  const rgbs = palette.map((p) => hexToRgb(getColor(p.slot)));
  const out = new ImageData(new Uint8ClampedArray(layer.base.data), layer.w, layer.h);
  const d = out.data;
  for (let i = 0; i < layer.index.length; i++) {
    const idx = layer.index[i];
    if (idx === 255) continue;
    const o = i * 4;
    d[o] = rgbs[idx][0];
    d[o + 1] = rgbs[idx][1];
    d[o + 2] = rgbs[idx][2];
  }
  const c = document.createElement("canvas");
  c.width = layer.w;
  c.height = layer.h;
  c.getContext("2d").putImageData(out, 0, 0);
  return c;
}