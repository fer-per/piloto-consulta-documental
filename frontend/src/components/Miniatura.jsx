import { useEffect, useState } from 'react';
import { apiArchivo } from '../services/api.js';

const cache = new Map();

export default function Miniatura({ url, titulo }) {
  const [origen, setOrigen] = useState(() => (url && cache.has(url) ? cache.get(url) : null));
  const [falla, setFalla] = useState(!url);

  useEffect(() => {
    if (!url) return undefined;
    if (cache.has(url)) {
      setOrigen(cache.get(url));
      return undefined;
    }

    let activo = true;
    apiArchivo(url)
      .then((blob) => {
        const objecto = URL.createObjectURL(blob);
        cache.set(url, objecto);
        if (activo) setOrigen(objecto);
      })
      .catch(() => {
        if (activo) setFalla(true);
      });

    return () => {
      activo = false;
    };
  }, [url]);

  if (falla || !origen) {
    return (
      <div
        className="rounded bg-secondary-subtle d-flex align-items-center justify-content-center text-secondary"
        style={{ width: '100%', height: '100%', minHeight: '7rem' }}
        aria-label={`Sin miniatura de ${titulo}`}
      >
        <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5.5 1.5a.5.5 0 0 0-1 0V9.586l-1.293-1.293a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L9.5 9.586z" />
        </svg>
      </div>
    );
  }

  return <img src={origen} alt={`Miniatura de ${titulo}`} className="w-100 h-100 object-fit-cover" />;
}
