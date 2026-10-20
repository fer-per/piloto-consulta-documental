import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RutaProtegida() {
  const { usuario, cargandoSesion } = useAuth();
  const ubicacion = useLocation();

  if (cargandoSesion) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Cargando sesión...</span>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion }} />;
  }

  return <Outlet />;
}
