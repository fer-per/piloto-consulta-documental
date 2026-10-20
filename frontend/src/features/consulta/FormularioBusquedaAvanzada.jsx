export default function FormularioBusquedaAvanzada({
  filtros,
  catalogos,
  onCambiar,
  onBuscar,
  onLimpiar,
  cargando,
}) {
  const cambiar = (campo) => (evento) => onCambiar({ ...filtros, [campo]: evento.target.value });

  return (
    <form
      className="row g-3"
      onSubmit={(evento) => {
        evento.preventDefault();
        onBuscar();
      }}
    >
      <div className="col-12">
        <label htmlFor="av-texto" className="form-label">
          Texto completo
        </label>
        <input
          id="av-texto"
          type="search"
          className="form-control"
          placeholder="Palabras clave del contenido o descriptores"
          value={filtros.texto}
          onChange={cambiar('texto')}
          maxLength={200}
        />
      </div>

      <div className="col-12 col-md-6 col-xl-4">
        <label htmlFor="av-fondo" className="form-label">
          Fondo documental
        </label>
        <select id="av-fondo" className="form-select" value={filtros.fondo} onChange={cambiar('fondo')}>
          <option value="">Todos los fondos</option>
          {catalogos.fondos.map((fondo) => (
            <option key={fondo.id} value={fondo.id}>
              {fondo.denominacion}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12 col-md-6 col-xl-4">
        <label htmlFor="av-serie" className="form-label">
          Serie
        </label>
        <select id="av-serie" className="form-select" value={filtros.serie} onChange={cambiar('serie')}>
          <option value="">Todas las series</option>
          {catalogos.series.map((serie) => (
            <option key={serie} value={serie}>
              {serie}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12 col-md-6 col-xl-4">
        <label htmlFor="av-tipologia" className="form-label">
          Tipología documental
        </label>
        <select
          id="av-tipologia"
          className="form-select"
          value={filtros.tipologia}
          onChange={cambiar('tipologia')}
        >
          <option value="">Todas las tipologías</option>
          {catalogos.tipologias.map((tipologia) => (
            <option key={tipologia} value={tipologia}>
              {tipologia}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12 col-md-6 col-xl-4">
        <label htmlFor="av-desde" className="form-label">
          Fecha de producción desde
        </label>
        <input
          id="av-desde"
          type="date"
          className="form-control"
          value={filtros.fecha_desde}
          onChange={cambiar('fecha_desde')}
        />
      </div>

      <div className="col-12 col-md-6 col-xl-4">
        <label htmlFor="av-hasta" className="form-label">
          Fecha de producción hasta
        </label>
        <input
          id="av-hasta"
          type="date"
          className="form-control"
          value={filtros.fecha_hasta}
          onChange={cambiar('fecha_hasta')}
        />
      </div>

      <div className="col-12 d-flex flex-wrap gap-2">
        <button type="submit" className="btn btn-dark" disabled={cargando}>
          {cargando ? 'Buscando...' : 'Buscar documentos'}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onLimpiar} disabled={cargando}>
          Limpiar filtros
        </button>
      </div>
    </form>
  );
}
