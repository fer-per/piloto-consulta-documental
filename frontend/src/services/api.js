import { API_BASE } from '../config.js';

const CLAVE_TOKEN = 'siarc-ara.token';
const EVENTO_SESION = 'siarc-ara:sesion-invalida';

export class ErrorApi extends Error {
  constructor(mensaje, estado = 0, codigo = 'ERROR_DESCONOCIDO', detalles = undefined) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function quitarToken() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem('siarc-ara.usuario');
}

async function analizarRespuesta(respuesta) {
  if (respuesta.status === 401) {
    quitarToken();
    window.dispatchEvent(new Event(EVENTO_SESION));
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ErrorApi(
      datos?.error?.mensaje ?? 'Ocurrió un error inesperado.',
      respuesta.status,
      datos?.error?.codigo,
      datos?.error?.detalles,
    );
  }
  return datos;
}

export async function api(ruta, { metodo = 'GET', cuerpo = null, autenticado = true } = {}) {
  const cabeceras = { Accept: 'application/json' };
  if (cuerpo !== null) cabeceras['Content-Type'] = 'application/json';

  const token = obtenerToken();
  if (autenticado && token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo !== null ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. Verifique su conexión.', 0, 'SIN_CONEXION');
  }

  return analizarRespuesta(respuesta);
}

export async function apiArchivo(ruta) {
  const cabeceras = {};
  const token = obtenerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, { headers: cabeceras });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor.', 0, 'SIN_CONEXION');
  }

  if (respuesta.status === 401) {
    quitarToken();
    window.dispatchEvent(new Event(EVENTO_SESION));
    throw new ErrorApi('Sesión no válida o expirada. Inicie sesión nuevamente.', 401, 'TOKEN_INVALIDO');
  }

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    throw new ErrorApi(
      datos?.error?.mensaje ?? 'No fue posible recuperar el archivo.',
      respuesta.status,
      datos?.error?.codigo,
    );
  }

  return respuesta.blob();
}
