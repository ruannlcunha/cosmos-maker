import { manifest } from "../data/assets";
import { frameInfo, colsOf } from "./frames";

export const DIR_NAMES = ["baixo", "esquerda", "direita", "cima"];

// Opções do seletor de FPS (o padrão do tipo é incluído automaticamente)
export const FPS_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24];
const DEFAULT_FPS = 6;

// Configuração de animação de um tipo, lida do sizes.json.
// "cols" = colunas da sheet combinada (padrão: as do sizes.json).
// A sequence do sizes.json só vale com a quantidade padrão de colunas.
export function animConfig(type, cols) {
  const size = manifest.sizes[type] ?? {};
  const baseCols = frameInfo(type)?.cols ?? 1;
  const n = cols ?? baseCols;
  const valid = (c) => Number.isInteger(c) && c >= 0 && c < n;

  const custom = n === baseCols && Array.isArray(size.sequence) ? size.sequence.filter(valid) : [];
  return {
    seq: custom.length ? custom : Array.from({ length: n }, (_, i) => i),
    fps: size.fps > 0 ? size.fps : DEFAULT_FPS,
    staticFrame: valid(size.staticFrame) ? size.staticFrame : 0,
  };
}

export function fpsOptions(type, current) {
  const set = new Set([...FPS_OPTIONS, animConfig(type).fps]);
  if (current > 0) set.add(current);
  return [...set].sort((a, b) => a - b);
}

// Um quadro: a coluna "col" de cada linha em "rowList", lado a lado
function frameCanvas(sheet, fi, col, rowList) {
  const c = document.createElement("canvas");
  c.width = fi.fw * rowList.length;
  c.height = fi.fh;
  const ctx = c.getContext("2d");
  rowList.forEach((row, i) =>
    ctx.drawImage(sheet, col * fi.fw, row * fi.fh, fi.fw, fi.fh, i * fi.fw, 0, fi.fw, fi.fh)
  );
  return c;
}

const allRows = (fi, rows) => rows ?? Array.from({ length: fi.rows }, (_, i) => i);

// Um canvas por passo da animação. "rows" = quais linhas entram lado a lado
// (null = todas: no overworld, as 4 direções)
export function buildAnimFrames(sheet, type, rows = null) {
  const fi = frameInfo(type);
  if (!fi) return [sheet];
  const list = allRows(fi, rows);
  return animConfig(type, colsOf(sheet, type)).seq.map((col) => frameCanvas(sheet, fi, col, list));
}

// O quadro do modo Estático
export function buildStaticFrame(sheet, type, rows = null) {
  const fi = frameInfo(type);
  if (!fi) return sheet;
  return frameCanvas(sheet, fi, animConfig(type, colsOf(sheet, type)).staticFrame, allRows(fi, rows));
}