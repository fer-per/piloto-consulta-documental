export default function Paginacion({ pagina, porPagina, total, onCambio, cargando }) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  if (total <= porPagina) return null;

  const anterior = () => {
    if (pagina > 1 && !cargando) onCambio(pagina - 1);
  };
  const siguiente = () => {
    if (pagina < totalPaginas && !cargando) onCambio(pagina + 1);
  };

  return (
    <nav aria-label="Paginación de resultados" className="mt-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
        <span className="small text-muted">
          Página {pagina} de {totalPaginas} · {total} documento(s)
        </span>
        <div className="btn-group btn-group-sm">
          <button type="button" className="btn btn-outline-secondary" onClick={anterior} disabled={pagina <= 1 || cargando}>
            Anterior
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={siguiente}
            disabled={pagina >= totalPaginas || cargando}
          >
            Siguiente
          </button>
        </div>
      </div>
    </nav>
  );
}
