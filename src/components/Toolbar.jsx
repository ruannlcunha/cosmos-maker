import { useRef } from "react";
import { Undo2, Redo2, Dices, Download, Upload } from "lucide-react";
import { useStore } from "../store/useStore";
import { saveBlob } from "../lib/exportImage";

export default function Toolbar() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const randomize = useStore((s) => s.randomize);
  const loadCharacter = useStore((s) => s.loadCharacter);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const fileRef = useRef(null);

  const save = () => {
    const { selected, colors, unlocked } = useStore.getState();
    const json = JSON.stringify({ version: 1, selected, colors, unlocked }, null, 2);
    saveBlob(new Blob([json], { type: "application/json" }), "personagem.json");
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      loadCharacter(JSON.parse(await file.text()));
    } catch {
      alert("Arquivo inválido.");
    }
    e.target.value = "";
  };

  return (
    <div className="toolbar">
      <button className="btn" onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)" aria-label="Desfazer">
        <Undo2 size={16} />
      </button>
      <button className="btn" onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Y)" aria-label="Refazer">
        <Redo2 size={16} />
      </button>
      <button className="btn primary" onClick={randomize} title="Personagem aleatório">
        <Dices size={16} /> <span className="btn-label">Aleatório</span>
      </button>
      <button className="btn" onClick={save} title="Salvar personagem (.json)">
        <Download size={16} /> <span className="btn-label">Salvar</span>
      </button>
      <button className="btn" onClick={() => fileRef.current.click()} title="Carregar personagem (.json)">
        <Upload size={16} /> <span className="btn-label">Carregar</span>
      </button>
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
    </div>
  );
}