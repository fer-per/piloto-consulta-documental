import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { usuario, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const ubicacion = useLocation();

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) {
    return <Navigate to="/consulta" replace />;
  }

  const alEnviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(nombreUsuario.trim(), contrasena);
      const destino = ubicacion.state?.desde?.pathname ?? '/consulta';
      navigate(destino, { replace: true });
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3">
      <div className="w-100" style={{ maxWidth: '26rem' }}>
        <div className="text-center mb-4">
          <h1 className="h4 fw-semibold mb-1">SIARC-ARA</h1>
          <p className="text-muted small mb-0">
            Archivo Regional de Arequipa
            <br />
            Consulta de documentos históricos y administrativos
          </p>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h2 className="h6 text-uppercase text-muted mb-3">Inicio de sesión</h2>

            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={alEnviar} noValidate>
              <div className="mb-3">
                <label htmlFor="usuario" className="form-label">
                  Usuario o correo
                </label>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  className="form-control"
                  autoComplete="username"
                  value={nombreUsuario}
                  onChange={(evento) => setNombreUsuario(evento.target.value)}
                  required
                  minLength={3}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label htmlFor="contrasena" className="form-label">
                  Contraseña
                </label>
                <input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  className="form-control"
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(evento) => setContrasena(evento.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-dark w-100" disabled={enviando}>
                {enviando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Verificando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center small text-muted mt-3 mb-0">
          El acceso está limitado a los perfiles Administrador, Archivista y Usuario externo.
        </p>
      </div>
    </div>
  );
}
