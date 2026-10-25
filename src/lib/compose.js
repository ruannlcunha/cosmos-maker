import { assetsById, manifest, getLayers, idsOf, supports } from "../data/assets";
import { loadLayer, recolorLayer } from "./layers";
import { frameInfo, combinedCols } from "./frames";

const catOrder = Object.fromEntries(manifest.categories.map((c, i) => [c.id, i]));

export async function compose(type, selected, getColor, isCancelled = () => false) {
  const { h } = manifest.sizes[type];
  const fi = frameInfo(type);

  const items = [];
  manifest.categories.forEach((cat) => {
    idsOf(selected[cat.id]).forEach((id, pos) => {
      const asset = assetsById[id];
      if (!asset || !supports(asset, selected)) return;
      const bump = cat.multiple ? pos * 0.01 : 0;
      getLayers(asset, selected, type).forEach((layer) =>
        items.push({ asset, layer, z: layer.zIndex + bump, order: catOrder[cat.id] })
      );
    });
  });
  items.sort((a, b) => a.z - b.z || a.order - b.order);

  const loaded = await Promise.all(items.map((i) => loadLayer(i.asset, i.layer, type)));
  if (isCancelled()) return null;

  // só as camadas que têm imagem
  const drawn = items.map((item, i) => ({ item, layer: loaded[i] })).filter((d) => d.layer);

  // colunas da sheet final: o menor múltiplo comum das colunas das camadas
  const cols = fi ? combinedCols(drawn.map((d) => d.layer.cols), fi.cols) : 1;

  const out = document.createElement("canvas");
  out.width = fi ? cols * fi.fw : manifest.sizes[type].w;
  out.height = h;
  const ctx = out.getContext("2d");

  drawn.forEach(({ item, layer }) => {
    const img = recolorLayer(layer, item.asset.palette, getColor);
    // camadas com menos colunas se repetem até preencher a sheet
    const step = fi ? layer.cols : cols;
    for (let c = 0; c < cols; c += step) ctx.drawImage(img, c * (fi?.fw ?? 0), 0);
  });

  return out;
}