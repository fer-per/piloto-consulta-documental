import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import VisorDocumento from '../features/consulta/VisorDocumento.jsx';

function Dato({ etiqueta, valor }) {
  if (valor === null || valor === undefined || valor === '') return null;
  return (
    <div className="col-12 col-md-6 col-xl-4">
      <dt className="small text-muted">{etiqueta}</dt>
      <dd className="mb-3">{valor}</dd>
    </div>
  );
}

export default function DocumentoPage() {
  const { id } = useParams();
  const [documento, setDocumento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    api(`/api/documentos/${id}`)
      .then((datos) => {
        if (activo) setDocumento(datos.documento);
      })
      .catch((errorApi) => {
        if (activo) setError(errorApi.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return (
      <div className="text-center text-muted py-5" role="status">
        <span className="spinner-border spinner-border-sm me-2" />
        Cargando documento...
      </div>
    );
  }

  if (error) {
    return (
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
          <Link to="/consulta" className="btn btn-outline-secondary btn-sm">
            Volver a la consulta
          </Link>
        </div>
      </div>
    );
  }

  if (!documento) return null;

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-xl-10">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb small mb-0">
            <li className="breadcrumb-item">
              <Link to="/consulta">Consulta documental</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Documento #{documento.id}
            </li>
          </ol>
        </nav>

        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h1 className="h4 fw-semibold mb-1">{documento.titulo}</h1>
            <p className="text-muted small mb-0">
              {documento.repositorio} · {documento.fondo}
              {documento.serie ? ` · ${documento.serie}` : ''}
              {documento.anio ? ` · ${documento.anio}` : ''}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-1">
            <span className="badge text-bg-secondary">{documento.tipologia}</span>
            <span className="badge text-bg-light border">{documento.formato}</span>
            {documento.folios && <span className="badge text-bg-light border">{documento.folios} fol.</span>}
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7 order-2 order-lg-1">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-3 p-md-4">
                <h2 className="h6 text-uppercase text-muted mb-3">Ficha descriptiva</h2>
                <dl className="row mb-0">
                  <Dato etiqueta="Fondo documental" valor={documento.fondo} />
                  <Dato etiqueta="Serie" valor={documento.serie} />
                  <Dato etiqueta="Subserie" valor={documento.subserie} />
                  <Dato etiqueta="Protocolo" valor={documento.protocolo} />
                  <Dato etiqueta="Año del protocolo" valor={documento.anio} />
                  <Dato etiqueta="Registro" valor={documento.registro} />
                  <Dato etiqueta="Fecha de producción" valor={documento.fechaProduccion ?? documento.fecha} />
                  <Dato etiqueta="Siglo" valor={documento.siglo} />
                  <Dato etiqueta="Estado de conservación" valor={documento.estadoConservacion} />
                  <Dato etiqueta="Ubicación física" valor={documento.ubicacionFisica} />
                  <Dato etiqueta="Responsable de la descripción" valor={documento.responsableDescripcion} />
                  <Dato etiqueta="Usuario que cargó" valor={documento.usuarioCarga} />
                  <Dato
                    etiqueta="Fecha de carga"
                    valor={documento.fechaCarga ? new Date(documento.fechaCarga).toLocaleString('es-PE') : null}
                  />
                  <div className="col-12">
                    <dt className="small text-muted">Alcance de contenido</dt>
                    <dd>{documento.alcanceContenido || 'Sin descripción de alcance.'}</dd>
                  </div>
                  <Dato etiqueta="Descriptores" valor={documento.descriptores} />
                  <Dato etiqueta="Observaciones" valor={documento.observaciones} />
                </dl>
              </div>
            </div>

            {documento.interesados?.length > 0 && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-3 p-md-4">
                  <h2 className="h6 text-uppercase text-muted mb-3">Interesados</h2>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th scope="col">Nombre</th>
                          <th scope="col">Documento</th>
                          <th scope="col">Rol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documento.interesados.map((interesado, indice) => (
                          <tr key={`${interesado.nombre}-${indice}`}>
                            <td>{interesado.nombre}</td>
                            <td>{interesado.documento ?? '—'}</td>
                            <td>{interesado.rol}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-12 col-lg-5 order-1 order-lg-2">
            <VisorDocumento documento={documento} />
          </div>
        </div>
      </div>
    </div>
  );
}
