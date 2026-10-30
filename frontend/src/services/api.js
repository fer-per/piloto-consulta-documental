const CLAVE_TOKEN = 'siarc_ara_piloto_token';
const CLAVE_USUARIO = 'siarc_ara_piloto_usuario';
export const EVENTO_SESION = 'siarc-ara:sesion-invalida';

const PERFILES = {
  ADMINISTRADOR: 'admin',
  ARCHIVISTA: 'archivero',
  USUARIO_EXTERNO: 'viewer',
};

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function guardarSesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function leerUsuario() {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function limpiarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

function normalizarUsuario(usuario) {
  if (!usuario) return null;
  return {
    ...usuario,
    name: usuario.nombreCompleto ?? `${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim(),
    role: PERFILES[usuario.perfil] ?? usuario.perfil,
  };
}

function mensajeError(datos) {
  return datos?.error?.mensaje ?? datos?.mensaje ?? 'No se pudo completar la operación.';
}

async function peticion(ruta, opciones = {}) {
  const { metodo = 'GET', cuerpo } = opciones;
  const cabeceras = { Accept: 'application/json' };
  if (cuerpo) cabeceras['Content-Type'] = 'application/json';
  const token = obtenerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }

  const datos = await respuesta.json().catch(() => null);

  if (respuesta.status === 401) {
    limpiarSesion();
    window.dispatchEvent(new Event(EVENTO_SESION));
  }

  if (!respuesta.ok) {
    throw new Error(mensajeError(datos));
  }

  return datos;
}

export async function apiArchivo(ruta) {
  const cabeceras = {};
  const token = obtenerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(ruta, { headers: cabeceras });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }

  if (respuesta.status === 401) {
    limpiarSesion();
    window.dispatchEvent(new Event(EVENTO_SESION));
    throw new Error('Sesión no válida o expirada. Inicie sesión nuevamente.');
  }

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    throw new Error(mensajeError(datos));
  }

  return respuesta.blob();
}

function listaDescriptores(descriptores) {
  if (!descriptores) return [];
  if (Array.isArray(descriptores)) return descriptores;
  return String(descriptores)
    .split(',')
    .map((descriptor) => descriptor.trim())
    .filter(Boolean);
}

function normalizarResumen(documento) {
  return {
    id: documento.id,
    codigo: documento.registro ? `ARC-${documento.registro}` : `ARC-${String(documento.id).padStart(8, '0')}`,
    titulo: documento.titulo,
    tipo: documento.tipologia,
    tipologia: documento.tipologia,
    fondo: documento.fondo,
    serie: documento.serie,
    subserie: documento.subserie,
    escribano: null,
    protocolo: documento.protocolo,
    registro: documento.registro,
    anio: documento.anio,
    fecha: documento.fecha,
    folios: documento.folios == null ? '' : String(documento.folios),
    lugar: null,
    conservacion: documento.estadoConservacion ?? null,
    formato: documento.formato,
    repositorio: documento.repositorio,
    relevancia: documento.relevancia,
    miniatura_url: documento.miniaturaUrl ?? null,
    archivo_url: documento.archivoUrl ?? `/api/documentos/${documento.id}/archivo`,
    digitalizado: Boolean(documento.digitalizado ?? (documento.miniaturaUrl || documento.archivoUrl)),
    descriptores: listaDescriptores(documento.descriptores),
    alcance: documento.alcanceContenido ?? null,
  };
}

function normalizarFicha(documento) {
  const resumen = normalizarResumen(documento);
  return {
    ...resumen,
    lugar: documento.ubicacionFisica ?? null,
    observaciones: documento.observaciones ?? null,
    fechaCarga: documento.fechaCarga ?? null,
    usuarioCarga: documento.usuarioCarga ?? null,
    responsableDescripcion: documento.responsableDescripcion ?? null,
    interesados: documento.interesados ?? [],
  };
}

function normalizarResultado(datos) {
  const porPagina = datos.porPagina ?? 10;
  const total = datos.total ?? 0;
  return {
    total,
    pagina: datos.pagina ?? 1,
    porPagina,
    paginas: porPagina > 0 ? Math.ceil(total / porPagina) : 0,
    resultados: (datos.resultados ?? []).map(normalizarResumen),
  };
}

export async function iniciarSesion(username, password) {
  const datos = await peticion('/api/auth/login', {
    metodo: 'POST',
    cuerpo: { usuario: username, contrasena: password },
  });
  return { token: datos.token, user: normalizarUsuario(datos.usuario) };
}

export async function validarSesion() {
  const datos = await peticion('/api/auth/sesion');
  return normalizarUsuario(datos.usuario);
}

export function cerrarSesion() {
  return peticion('/api/auth/logout', { metodo: 'POST' }).catch(() => null);
}

export async function buscarSimple({ q, pagina = 1, porPagina = 10, orden = 'relevancia' }) {
  const parametros = new URLSearchParams({
    q,
    pagina: String(pagina),
    por_pagina: String(porPagina),
    orden,
  });
  return normalizarResultado(await peticion(`/api/documentos/busqueda/simple?${parametros}`));
}

export async function buscarAvanzada(filtros) {
  const parametros = new URLSearchParams();
  const mapa = {
    texto: 'texto',
    fondo: 'fondo',
    serie: 'serie',
    tipologia: 'tipologia',
    conservacion: 'conservacion',
    fecha_desde: 'fecha_desde',
    fecha_hasta: 'fecha_hasta',
    orden: 'orden',
    pagina: 'pagina',
    por_pagina: 'por_pagina',
  };
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      parametros.set(mapa[clave] ?? clave, String(valor));
    }
  }
  return normalizarResultado(await peticion(`/api/documentos/busqueda/avanzada?${parametros}`));
}

export async function obtenerDocumento(id) {
  const datos = await peticion(`/api/documentos/${id}`);
  return normalizarFicha(datos.documento);
}

export function obtenerCatalogos() {
  return peticion('/api/catalogos');
}
