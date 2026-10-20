import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NOMBRES_PERFIL } from '../config.js';

export default function LayoutPrincipal() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const alCerrarSesion = async () => {
    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container-fluid px-3 px-md-4">
          <Link className="navbar-brand fw-semibold" to="/consulta">
            SIARC-ARA
            <span className="ms-2 small fw-normal text-secondary-emphasis d-none d-sm-inline">
              Archivo Regional de Arequipa
            </span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#menuPrincipal"
            aria-controls="menuPrincipal"
            aria-label="Abrir menú"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="menuPrincipal">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/consulta">
                  Consulta documental
                </NavLink>
              </li>
            </ul>

            {usuario && (
              <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
                <span className="navbar-text small text-white-50">
                  {usuario.nombreCompleto}
                  <span className="badge text-bg-secondary ms-2">
                    {NOMBRES_PERFIL[usuario.perfil] ?? usuario.perfil}
                  </span>
                </span>
                <button type="button" className="btn btn-outline-light btn-sm" onClick={alCerrarSesion}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="container-fluid px-3 px-md-4 py-4 flex-grow-1">
        <Outlet />
      </main>

      <footer className="border-top py-3 bg-white">
        <div className="container-fluid px-3 px-md-4 small text-muted">
          SIARC-ARA · Sistema Informático para la Automatización de Procesos de Organización Documental y
          Consultas del Archivo Regional de Arequipa
        </div>
      </footer>
    </div>
  );
}
