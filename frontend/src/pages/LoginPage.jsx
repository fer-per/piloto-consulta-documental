import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { IconoOjo, IconoUsuario } from '../components/Iconos.jsx';

const CUENTAS_DEMO = [
  { username: 'anaquispe', password: 'Admin123!', rol: 'Administrador' },
  { username: 'lmamani', password: 'Archivo123!', rol: 'Archivista' },
  { username: 'cflores', password: 'Consulta123!', rol: 'Usuario externo' },
];

export default function LoginPage() {
  const { usuario, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/busqueda" replace />;

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(nombreUsuario.trim(), contrasena);
      navegar('/busqueda', { replace: true });
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setEnviando(false);
    }
  };

  const completarDemo = (cuenta) => {
    setNombreUsuario(cuenta.username);
    setContrasena(cuenta.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-orb login-orb-uno" />
      <div className="login-orb login-orb-dos" />

      <div className="login-card">
        <div className="login-brand">
          <img src="/marcas/logo-ara.png" alt="Archivo Regional de Arequipa" className="login-logo" />
          <div>
            <p className="login-kicker">Archivo Regional de Arequipa</p>
            <h1 className="login-titulo">Sistema de consultas documentarias ARA</h1>
          </div>
        </div>

        <div className="login-separador" />

        <h2 className="login-encabezado">Iniciar sesión</h2>
        <p className="login-ayuda">Acceda con su usuario institucional para consultar el repositorio digital.</p>

        {error && (
          <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={enviar} noValidate>
          <div className="mb-3">
            <label htmlFor="usuario" className="form-label login-label">Usuario</label>
            <input
              id="usuario"
              type="text"
              className="form-control login-input"
              placeholder="Ej. anaquispe"
              autoComplete="username"
              value={nombreUsuario}
              onChange={(evento) => setNombreUsuario(evento.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="contrasena" className="form-label login-label">Contraseña</label>
            <div className="login-password">
              <input
                id="contrasena"
                type={verContrasena ? 'text' : 'password'}
                className="form-control login-input pe-5"
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                required
              />
              <button
                type="button"
                className="login-ojo"
                onClick={() => setVerContrasena((valor) => !valor)}
                aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <IconoOjo oculto={verContrasena} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn login-boton w-100" disabled={enviando}>
            {enviando ? (
              <span className="d-inline-flex align-items-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" />
                Verificando credenciales...
              </span>
            ) : (
              'Ingresar al sistema'
            )}
          </button>
        </form>

        <div className="login-demo mt-4">
          <div className="login-demo-cabecera">
            <IconoUsuario size={14} />
            <span>Accesos de prueba del piloto</span>
          </div>
          <div className="d-grid gap-2">
            {CUENTAS_DEMO.map((cuenta) => (
              <button
                key={cuenta.username}
                type="button"
                className="login-demo-item"
                onClick={() => completarDemo(cuenta)}
              >
                <span className="login-demo-usuario">{cuenta.username}</span>
                <span className="login-demo-clave">{cuenta.password}</span>
                <span className="login-demo-rol">{cuenta.rol}</span>
              </button>
            ))}
          </div>
          <p className="login-demo-nota">
            Seleccione una cuenta para completar el formulario. Tras cinco intentos fallidos la cuenta se bloquea por
            15 minutos.
          </p>
        </div>
      </div>

      <p className="login-pie">Piloto académico · Sistema de consultas documentarias ARA · 2026</p>
    </div>
  );
}
