import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, guardarToken, quitarToken } from '../services/api.js';

const CLAVE_USUARIO = 'siarc-ara.usuario';
const EVENTO_SESION = 'siarc-ara:sesion-invalida';
const AuthContext = createContext(null);

function leerUsuarioGuardado() {
  try {
    const crudo = localStorage.getItem(CLAVE_USUARIO);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('siarc-ara.token')) {
      setCargandoSesion(false);
      return undefined;
    }

    let activo = true;
    api('/api/auth/sesion')
      .then((datos) => {
        if (!activo) return;
        setUsuario(datos.usuario);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datos.usuario));
      })
      .catch(() => {
        if (activo) setUsuario(null);
      })
      .finally(() => {
        if (activo) setCargandoSesion(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESION, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION, alExpirar);
  }, []);

  const iniciarSesion = useCallback(async (nombreUsuario, contrasena) => {
    const resultado = await api('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { usuario: nombreUsuario, contrasena },
      autenticado: false,
    });
    guardarToken(resultado.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(resultado.usuario));
    setUsuario(resultado.usuario);
    return resultado;
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await api('/api/auth/logout', { metodo: 'POST' });
    } catch {
      // La sesión se descarta aunque el cierre no pueda registrarse.
    } finally {
      quitarToken();
      setUsuario(null);
    }
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargandoSesion, iniciarSesion, cerrarSesion }),
    [usuario, cargandoSesion, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return contexto;
}
