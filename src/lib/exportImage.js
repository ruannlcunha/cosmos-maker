import JSZip from "jszip";
import { GIFEncoder } from "gifenc";
import { manifest } from "../data/assets";
import { DIR_NAMES, animConfig, buildAnimFrames } from "./anim";
import { frameInfo, hasFrames, colsOf } from "./frames";

const EXT = { "image/png": "png", "image/webp": "webp", "image/jpeg": "jpg" };

function scaled(canvas, scale) {
  const out = document.createElement("canvas");
  out.width = canvas.width * scale;
  out.height = canvas.height * scale;
  const ctx = out.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

export function toBlob(canvas, scale, mime) {
  const out = document.createElement("canvas");
  out.width = canvas.width * scale;
  out.height = canvas.height * scale;
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return new Promise((res) => out.toBlob(res, mime, 0.95));
}

export function saveBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function downloadCanvas(canvas, name, scale = 1, mime = "image/png") {
  if (!canvas) return;
  saveBlob(await toBlob(canvas, scale, mime), `${name}.${EXT[mime]}`);
}

/* ---------- frames individuais ---------- */
function getFrames(sheet, type) {
  const fi = frameInfo(type);
  if (!fi) return [];
  const cols = colsOf(sheet, type);
  const list = [];
  for (let row = 0; row < fi.rows; row++) {
    for (let col = 0; col < cols; col++) {
      const c = document.createElement("canvas");
      c.width = fi.fw;
      c.height = fi.fh;
      c.getContext("2d").drawImage(sheet, col * fi.fw, row * fi.fh, fi.fw, fi.fh, 0, 0, fi.fw, fi.fh);
      const name =
        type === "overworld"
          ? `${DIR_NAMES[row]}_${col + 1}`
          : fi.rows === 1
            ? `frame_${col + 1}`
            : `linha${row + 1}_frame_${col + 1}`;
      list.push({ name, canvas: c });
    }
  }
  return list;
}

export async function downloadFramesZip(sheet, type, scale = 1, mime = "image/png") {
  if (!sheet || !hasFrames(type)) return;
  const zip = new JSZip();
  for (const fr of getFrames(sheet, type)) {
    zip.file(`${fr.name}.${EXT[mime]}`, await toBlob(fr.canvas, scale, mime));
  }
  saveBlob(await zip.generateAsync({ type: "blob" }), `${type}_frames.zip`);
}

/* ---------- GIF ---------- */

// Paleta global a partir das cores reais dos frames (índice 0 = transparente)
function indexFrames(frames) {
  const palette = [[0, 0, 0]];
  const lookup = new Map();
  const nearest = (r, g, b) => {
    let best = 1;
    let bestD = Infinity;
    for (let i = 1; i < palette.length; i++) {
      const p = palette[i];
      const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  };

  const indexed = frames.map((d) => {
    const idx = new Uint8Array(d.length / 4);
    for (let i = 0; i < idx.length; i++) {
      const o = i * 4;
      if (d[o + 3] < 128) { idx[i] = 0; continue; }
      const key = (d[o] << 16) | (d[o + 1] << 8) | d[o + 2];
      let v = lookup.get(key);
      if (v === undefined) {
        if (palette.length < 256) {
          v = palette.length;
          palette.push([d[o], d[o + 1], d[o + 2]]);
        } else {
          v = nearest(d[o], d[o + 1], d[o + 2]);
        }
        lookup.set(key, v);
      }
      idx[i] = v;
    }
    return idx;
  });
  return { palette, indexed };
}

export function makeGifBlob(frameCanvases, delay, scale = 1) {
  const w = frameCanvases[0].width * scale;
  const h = frameCanvases[0].height * scale;
  const rgba = frameCanvases.map((fc) =>
    scaled(fc, scale).getContext("2d").getImageData(0, 0, w, h).data
  );
  const { palette, indexed } = indexFrames(rgba);
  const gif = GIFEncoder();
  indexed.forEach((index) =>
    gif.writeFrame(index, w, h, {
      palette,
      delay,
      transparent: true,
      transparentIndex: 0,
      dispose: 2,
    })
  );
  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}

// tempo por quadro em ms, a partir do FPS (o padrão do tipo se não vier FPS)
const delayFor = (type, fps) => Math.round(1000 / (fps > 0 ? fps : animConfig(type).fps));

export function downloadGif(sheet, type, scale = 1, rows = null, fps) {
  if (!sheet || !hasFrames(type)) return;
  const frames = buildAnimFrames(sheet, type, rows);
  const blob = makeGifBlob(frames, delayFor(type, fps), scale);
  const suffix = type === "overworld" && rows ? `_${DIR_NAMES[rows[0]]}` : "";
  saveBlob(blob, `${type}${suffix}.gif`);
}

/* ---------- tudo em um zip ---------- */

export async function downloadAll({ sheets, character, scale, gifScale, mime, fps = {} }) {
  const types = Object.keys(manifest.sizes);
  if (types.some((t) => !sheets[t])) return;

  const ext = EXT[mime];
  const zip = new JSZip();

  for (const type of types) {
    const framed = hasFrames(type);
    zip.file(`${framed ? `${type}_sheet` : type}.${ext}`, await toBlob(sheets[type], scale, mime));
    if (!framed) continue;

    zip.file(
      `${type}.gif`,
      makeGifBlob(buildAnimFrames(sheets[type], type), delayFor(type, fps[type]), gifScale)
    );
    const folder = zip.folder(`${type}_frames`);
    for (const fr of getFrames(sheets[type], type)) {
      folder.file(`${fr.name}.${ext}`, await toBlob(fr.canvas, scale, mime));
    }
  }

  zip.file("personagem.json", JSON.stringify(character, null, 2));
  saveBlob(await zip.generateAsync({ type: "blob" }), "avatar.zip");
}

// escala da imagem aberta/salva pelo botão direito: no mínimo a do preview
// e ~384px no maior lado
export const openScale = (w, h, shown = 1) =>
  Math.max(Math.ceil(shown), Math.ceil(384 / Math.max(w, h)));