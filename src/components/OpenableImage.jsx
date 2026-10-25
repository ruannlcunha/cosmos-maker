import { useEffect, useState } from "react";

// Imagem invisível por cima do canvas: permite clicar com o botão direito
// (ou segurar o dedo) e abrir/salvar a imagem. É gerada depois de uma pausa nas
// alterações, para não pesar enquanto você arrasta a roda de cor.
export default function OpenableImage({ make, deps, delay = 300, title }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      let blob = null;
      try {
        blob = await make();
      } catch {
        /* ignora: o preview continua funcionando sem a imagem */
      }
      if (cancelled || !blob) return;
      setUrl(URL.createObjectURL(blob));
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // libera a URL anterior ao trocar ou desmontar
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url]
  );

  if (!url) return null;
  return <img className="open-img" src={url} alt="" title={title} draggable={false} />;
}