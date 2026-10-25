import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { compose } from "./compose";
import { resolveSlot } from "./slots";

export function useComposite(type) {
  const selected = useStore((s) => s.selected);
  const colors = useStore((s) => s.colors);
  const unlocked = useStore((s) => s.unlocked);
  const [canvas, setCanvas] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const getColor = (slot) => resolveSlot(slot, colors, unlocked);
    compose(type, selected, getColor, () => cancelled).then((c) => {
      if (c && !cancelled) setCanvas(c);
    });
    return () => {
      cancelled = true;
    };
  }, [selected, colors, unlocked, type]);

  return canvas;
}