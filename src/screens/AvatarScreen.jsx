import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shirt, Palette, Download } from "lucide-react";
import { useComposite } from "../lib/useComposite";
import { useViewport } from "../lib/useViewport";
import { useStore } from "../store/useStore";
import { manifest } from "../data/assets";
import { frameInfo } from "../lib/frames";
import AssetPicker from "../components/AssetPicker";
import ColorPanel from "../components/ColorPanel";
import SpriteCard from "../components/SpriteCard";
import ExportBar from "../components/ExportBar";
import Toolbar from "../components/Toolbar";
import CreditsModal from "../components/CreditsModal";

const DIR_LABELS = ["Baixo", "Esquerda", "Direita", "Cima"];
const MOBILE_MAX = 1100; // abaixo disso: layout vertical
const PAD = 18; // padding + borda de um card compacto

const TABS = [
  { id: "pieces", label: "Peças", Icon: Shirt },
  { id: "colors", label: "Cores", Icon: Palette },
  { id: "export", label: "Exportar", Icon: Download },
];

// tamanho de "uma vista" de um tipo: um quadro por linha lado a lado, ou a imagem inteira
function viewDims(type) {
  const f = frameInfo(type);
  const s = manifest.sizes[type];
  return f ? { w: f.fw * f.rows, h: f.fh, cols: f.cols } : { w: s.w, h: s.h, cols: 1 };
}

export default function AvatarScreen() {
  const portrait = useComposite("portrait");
  const overworld = useComposite("overworld");
  const battle = useComposite("battle");
  const { w: vw, h: vh } = useViewport();
  const [tab, setTab] = useState("pieces");

  const isMobile = vw < MOBILE_MAX;

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || !(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); useStore.getState().undo(); }
      if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); useStore.getState().redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pv = viewDims("portrait");
  const ov = viewDims("overworld");
  const bv = viewDims("battle");

  const topbar = (
    <header className="topbar">
      <div className="topbar-left">
        <Link to="/" className="btn" title="Voltar ao início" aria-label="Voltar ao início">
          <ArrowLeft size={16} />
        </Link>
        <h1>Cosmos Maker</h1>
      </div>
      <Toolbar />
    </header>
  );

  /* ---------------- mobile / tablet ---------------- */
  if (isMobile) {
    // a faixa fixa do topo usa até ~42% da altura
    const budget = vh * 0.42 - 60 - 48;
    const pScale = Math.max(
      1,
      Math.min(4, Math.floor(budget / pv.h), Math.floor((vw * 0.5 - PAD) / pv.w))
    );
    const rightW = vw - 16 - 8 - (pv.w * pScale + PAD) - PAD;
    const owScale = Math.max(1, Math.min(3, Math.floor(rightW / ov.w)));
    const btScale = Math.max(1, Math.min(2, Math.floor(rightW / bv.w)));
    const pRaw = Math.max(1, Math.floor(pScale / pv.cols));

    return (
      <div className="app mobile">
        {topbar}

        <div className="m-sticky">
          <div className="m-preview">
            <SpriteCard
              compact
              type="portrait"
              title="Portrait"
              sheet={portrait}
              scale={pScale}
              rawScale={pRaw}
              hint={`${pScale}x`}
            />
            <div className="m-sprites">
              <SpriteCard compact type="overworld" title="Overworld" sheet={overworld} scale={owScale} rawScale={1} />
              <SpriteCard compact type="battle" title="Battle" sheet={battle} scale={btScale} rawScale={1} />
            </div>
          </div>

          <div className="tabs m-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="m-panel">
          {tab === "pieces" && <AssetPicker />}
          {tab === "colors" && <ColorPanel />}
          {tab === "export" && (
            <>
              <ExportBar portrait={portrait} overworld={overworld} battle={battle} />
              <div className="m-credits">
                <CreditsModal inline />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- desktop ---------------- */
  const byH = Math.floor((vh - 190) / pv.h);
  const byW = Math.floor((Math.min(vw, 1500) - 960) / pv.w);
  const portraitScale = Math.max(2, Math.min(6, byH, byW));
  const portraitRawScale = Math.max(1, Math.floor(portraitScale / pv.cols));
  const lowHeight = vh < 820;

  return (
    <div className="app">
      {topbar}

      <div className="layout">
        <aside className="col">
          <AssetPicker />
        </aside>

        <main className="stage">
          <SpriteCard
            type="portrait"
            title="Portrait"
            sheet={portrait}
            scale={portraitScale}
            rawScale={portraitRawScale}
            hint={`${portraitScale}x`}
          />

          <div className="sprites">
            <SpriteCard
              type="overworld"
              title="Overworld"
              sheet={overworld}
              scale={3}
              rawScale={lowHeight ? 1 : 2}
              labels={DIR_LABELS}
            />
            <SpriteCard type="battle" title="Battle" sheet={battle} scale={2} rawScale={1} />
          </div>
        </main>

        <aside className="col">
          <ColorPanel />
          <ExportBar portrait={portrait} overworld={overworld} battle={battle} />
        </aside>
      </div>

      <CreditsModal />
    </div>
  );
}