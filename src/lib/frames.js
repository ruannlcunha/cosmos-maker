import { manifest } from "../data/assets";

const MAX_COLS = 64;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// Tamanho dos quadros de um tipo, ou null se o tipo é uma imagem única.
// "frame" pode ser um número (quadrado) ou { w, h }.
export function frameInfo(type) {
  const { w, h, frame } = manifest.sizes[type];
  if (!frame) return null;
  const fw = typeof frame === "number" ? frame : frame.w;
  const fh = typeof frame === "number" ? frame : frame.h;
  if (!fw || !fh) return null;
  return { fw, fh, cols: Math.floor(w / fw), rows: Math.floor(h / fh) };
}

// Só faz sentido animar/alternar modos se houver mais de um quadro
export function hasFrames(type) {
  const f = frameInfo(type);
  return !!f && f.cols * f.rows > 1;
}

// Quantas colunas tem uma sheet (pode variar conforme as peças equipadas)
export function colsOf(sheet, type) {
  const fi = frameInfo(type);
  return fi ? Math.max(1, Math.floor(sheet.width / fi.fw)) : 1;
}

// Colunas da sheet combinada: o menor múltiplo comum das colunas das camadas
const warned = new Set();
export function combinedCols(colList, fallback) {
  if (!colList.length) return fallback;
  let lcm = 1;
  let max = 1;
  for (const c of colList) {
    max = Math.max(max, c);
    lcm = (lcm / gcd(lcm, c)) * c;
  }
  if (lcm <= MAX_COLS) return lcm;

  const key = [...new Set(colList)].sort((a, b) => a - b).join(", ");
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(
      `[frames] quantidades de quadros (${key}) dão ${lcm} colunas, acima do limite de ${MAX_COLS}. ` +
        `Usando ${max}; algumas peças não repetem de forma exata.`
    );
  }
  return max;
}