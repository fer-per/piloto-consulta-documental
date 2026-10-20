import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import FormularioBusquedaAvanzada from '../features/consulta/FormularioBusquedaAvanzada.jsx';
import ResultadoDocumento from '../features/consulta/ResultadoDocumento.jsx';
import Paginacion from '../features/consulta/Paginacion.jsx';

const FILTROS_INICIALES = {
  texto: '',
  fondo: '',
  serie: '',
  tipologia: '',
  fecha_desde: '',
  fecha_hasta: '',
};

const CATALOGOS_INICIALES = { fondos: [], series: [], tipologias: [] };

export default function ConsultaPage() {
  const [modo, setModo] = useState('simple');
  const [consultaSimple, setConsultaSimple] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [orden, setOrden] = useState('relevancia');
  const [pagina, setPagina] = useState(1);
  const [catalogos, setCatalogos] = useState(CATALOGOS_INICIALES);
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      api('/api/catalogos/fondos'),
      api('/api/catalogos/series'),
      api('/api/catalogos/tipologias'),
    ])
      .then(([fondos, series, tipologias]) => {
        if (!activo) return;
        setCatalogos({ fondos: fondos.fondos, series: series.series, tipologias: tipologias.tipologias });
      })
      .catch(() => {
        // Los catálogos son auxiliares: la búsqueda sigue siendo posible sin ellos.
      });
    return () => {
      activo = false;
    };
  }, []);

  const construirParametros = (paginaActual, ordenBusqueda) => {
    const parametros = new URLSearchParams({
      pagina: String(paginaActual),
      por_pagina: '10',
      orden: ordenBusqueda,
    });

    if (modo === 'simple') {
      parametros.set('q', consultaSimple.trim());
    } else {
      const criterios = {
        texto: filtros.texto.trim(),
        fondo: filtros.fondo,
        serie: filtros.serie,
        tipologia: filtros.tipologia,
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
      };
      for (const [clave, valor] of Object.entries(criterios)) {
        if (valor !== '') parametros.set(clave, valor);
      }
    }
    return parametros;
  };

  const buscar = async (paginaActual = 1, ordenBusqueda = orden) => {
    if (modo === 'simple' && !consultaSimple.trim()) {
      setError('Ingrese una palabra clave para iniciar la búsqueda.');
      setResultados(null);
      return;
    }

    setError(null);
    setCargando(true);
    try {
      const parametros = construirParametros(paginaActual, ordenBusqueda);
      const ruta =
        modo === 'simple'
          ? `/api/documentos/busqueda/simple?${parametros}`
          : `/api/documentos/busqueda/avanzada?${parametros}`;
      const datos = await api(ruta);
      setResultados(datos);
      setPagina(datos.pagina);
    } catch (errorApi) {
      setResultados(null);
      setError(errorApi.message);
    } finally {
      setCargando(false);
    }
  };

  const cambiarModo = (nuevoModo) => {
    if (nuevoModo === modo) return;
    setModo(nuevoModo);
    setResultados(null);
    setError(null);
    setPagina(1);
  };

  const limpiar = () => {
    setFiltros(FILTROS_INICIALES);
    setResultados(null);
    setError(null);
    setPagina(1);
  };

  const cambiarPagina = (nuevaPagina) => buscar(nuevaPagina);

  const cambiarOrden = (evento) => {
    const nuevoOrden = evento.target.value;
    setOrden(nuevoOrden);
    if (resultados) buscar(pagina, nuevoOrden);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-xl-10">
        <header className="mb-4">
          <h1 className="h3 fw-semibold mb-1">Consulta documental</h1>
          <p className="text-muted mb-0">
            Busque en el repositorio digital del Archivo Regional de Arequipa por texto completo o mediante
            filtros archivísticos.
          </p>
        </header>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-3 p-md-4">
            <ul className="nav nav-pills nav-fill mb-4" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  className={`nav-link ${modo === 'simple' ? 'active' : ''}`}
                  onClick={() => cambiarModo('simple')}
                >
                  Búsqueda simple
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  className={`nav-link ${modo === 'avanzada' ? 'active' : ''}`}
                  onClick={() => cambiarModo('avanzada')}
                >
                  Búsqueda avanzada
                </button>
              </li>
            </ul>

            {modo === 'simple' ? (
              <form
                onSubmit={(evento) => {
                  evento.preventDefault();
                  buscar(1);
                }}
                className="row g-2"
              >
                <div className="col">
                  <label htmlFor="q" className="visually-hidden">
                    Palabra clave
                  </label>
                  <input
                    id="q"
                    type="search"
                    className="form-control form-control-lg"
                    placeholder='Palabra clave, por ejemplo: "escribanía" o "terreno"'
                    value={consultaSimple}
                    onChange={(evento) => setConsultaSimple(evento.target.value)}
                    maxLength={200}
                    autoFocus
                  />
                </div>
                <div className="col-auto">
                  <button type="submit" className="btn btn-dark btn-lg px-4" disabled={cargando}>
                    {cargando ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </form>
            ) : (
              <FormularioBusquedaAvanzada
                filtros={filtros}
                catalogos={catalogos}
                onCambiar={setFiltros}
                onBuscar={() => buscar(1)}
                onLimpiar={limpiar}
                cargando={cargando}
              />
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-warning mt-4 py-2 small" role="alert">
            {error}
          </div>
        )}

        {cargando && !resultados && (
          <div className="text-center text-muted py-5" role="status">
            <span className="spinner-border spinner-border-sm me-2" />
            Consultando el repositorio documental...
          </div>
        )}

        {resultados && (
          <section className="mt-4" aria-live="polite">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
              <p className="mb-0 small text-muted">
                {resultados.total} documento(s) encontrados
                {modo === 'simple' ? ` para «${consultaSimple.trim()}»` : ' con los criterios indicados'}.
              </p>
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="orden" className="small text-muted mb-0">
                  Ordenar por
                </label>
                <select
                  id="orden"
                  className="form-select form-select-sm w-auto"
                  value={orden}
                  onChange={cambiarOrden}
                >
                  <option value="relevancia">Relevancia</option>
                  <option value="fecha">Fecha de producción</option>
                </select>
              </div>
            </div>

            {resultados.resultados.length === 0 ? (
              <div className="alert alert-info py-2 small mb-0" role="status">
                No se encontraron documentos que coincidan con los criterios de búsqueda. Pruebe con otros
                términos o verifique las fechas ingresadas.
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
                {resultados.resultados.map((documento) => (
                  <ResultadoDocumento key={documento.id} documento={documento} />
                ))}
              </div>
            )}

            <Paginacion
              pagina={resultados.pagina}
              porPagina={resultados.porPagina}
              total={resultados.total}
              onCambio={cambiarPagina}
              cargando={cargando}
            />
          </section>
        )}

        {!resultados && !error && !cargando && (
          <p className="text-muted small mt-4">
            Indique un criterio de búsqueda para consultar los documentos del archivo.
          </p>
        )}
      </div>
    </div>
  );
}
