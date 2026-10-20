import { Link } from 'react-router-dom';
import Miniatura from './Miniatura.jsx';

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no registrada';
  const [anio, mes, dia] = fecha.split('-');
  const meses = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'set', 'oct', 'nov', 'dic',
  ];
  return `${Number(dia)} ${meses[Number(mes) - 1]} ${anio}`;
}

export default function ResultadoDocumento({ documento }) {
  return (
    <div className="col">
      <div className="card h-100 border-0 shadow-sm">
        <div className="row g-0">
          <div className="col-4 col-sm-3" style={{ minHeight: '9rem' }}>
            <Miniatura url={documento.miniaturaUrl} titulo={documento.titulo} />
          </div>
          <div className="col-8 col-sm-9">
            <div className="card-body d-flex flex-column h-100">
              <div className="d-flex flex-wrap gap-1 mb-2">
                <span className="badge text-bg-secondary">{documento.tipologia}</span>
                <span className="badge text-bg-light border">{documento.formato}</span>
                {documento.folios && <span className="badge text-bg-light border">{documento.folios} fol.</span>}
              </div>

              <h3 className="h6 card-title mb-1">
                <Link to={`/documentos/${documento.id}`} className="text-decoration-none">
                  {documento.titulo}
                </Link>
              </h3>

              <p className="small text-muted mb-2">
                {formatearFecha(documento.fecha)} · {documento.fondo}
                {documento.serie ? ` · ${documento.serie}` : ''}
              </p>

              <div className="mt-auto d-flex justify-content-between align-items-center">
                <span className="small text-muted">
                  {documento.repositorio} · {documento.protocolo} · {documento.anio}
                </span>
                <Link to={`/documentos/${documento.id}`} className="btn btn-sm btn-outline-dark">
                  Ver documento
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
