import { consultar } from '../../config/database.js';

const COLUMNAS = `
    a.id,
    a.id_titulo_escritura,
    te.nombre AS titulo,
    a.tipologia_documental AS tipologia,
    a.serie,
    a.subserie,
    a.formato,
    a.folios,
    a.estado_conservacion,
    a.alcance_contenido,
    a.descriptores,
    a.fecha_produccion,
    a.fecha_carga,
    a.observaciones,
    a.ubicacion_fisica,
    a.ruta_archivo,
    a.ruta_miniatura,
    r.numero AS registro,
    ap.anio AS anio_protocolo,
    p.numero AS protocolo,
    f.id AS id_fondo,
    f.denominacion AS fondo,
    rep.numero AS repositorio,
    rep.siglo,
    rd.nombre_completo AS responsable_descripcion,
    u.nombre_usuario AS usuario_carga
`;

const RELACIONES = `
    FROM archivo a
    JOIN titulo_escritura te ON te.id = a.id_titulo_escritura
    JOIN registro r          ON r.id = te.id_registro
    JOIN anio_protocolo ap   ON ap.id = r.id_anio_protocolo
    JOIN protocolo p         ON p.id = ap.id_protocolo
    JOIN fondo f             ON f.id = p.id_fondo
    JOIN repositorio rep     ON rep.id = f.id_repositorio
    LEFT JOIN responsable_descripcion rd ON rd.id = a.id_responsable_descripcion
    LEFT JOIN usuario u      ON u.id = a.id_usuario_carga
`;

const CONTENIDO_TS = `to_tsvector('spanish', f_unaccent(coalesce(a.alcance_contenido, '')))`;
const ORDEN_FECHA = 'coalesce(a.fecha_produccion, a.fecha_carga::date) DESC, a.id DESC';
const ORDEN_ANTIGUO = 'coalesce(a.fecha_produccion, a.fecha_carga::date) ASC, a.id ASC';
const ORDEN_TITULO = 'f_unaccent(te.nombre) ASC, a.id ASC';

export async function buscarDocumentos({
  texto,
  fondo,
  serie,
  tipologia,
  conservacion,
  fechaDesde,
  fechaHasta,
  orden,
  pagina,
  porPagina,
}) {
  const parametros = [];
  const parametro = (valor) => {
    parametros.push(valor);
    return `$${parametros.length}`;
  };
  const condiciones = [];

  if (texto) {
    const p = parametro(texto);
    condiciones.push(`(
      ${CONTENIDO_TS} @@ plainto_tsquery('spanish', f_unaccent(${p}))
      OR f_unaccent(te.nombre) % f_unaccent(${p})
      OR f_unaccent(te.nombre) ILIKE '%' || f_unaccent(${p}) || '%'
      OR f_unaccent(coalesce(a.descriptores, '')) % f_unaccent(${p})
    )`);
  }
  if (fondo) condiciones.push(`f.id = ${parametro(fondo)}`);
  if (serie) condiciones.push(`a.serie = ${parametro(serie)}`);
  if (tipologia) condiciones.push(`a.tipologia_documental = ${parametro(tipologia)}`);
  if (conservacion) condiciones.push(`a.estado_conservacion = ${parametro(conservacion)}`);
  if (fechaDesde) condiciones.push(`a.fecha_produccion >= ${parametro(fechaDesde)}`);
  if (fechaHasta) condiciones.push(`a.fecha_produccion <= ${parametro(fechaHasta)}`);

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join('\n    AND ')}` : '';

  const { rows: conteo } = await consultar(
    `SELECT COUNT(*)::int AS total ${RELACIONES} ${where}`,
    parametros,
  );

  const columnaRelevancia = texto
    ? `(ts_rank(${CONTENIDO_TS}, plainto_tsquery('spanish', f_unaccent($1)))
        + similarity(f_unaccent(te.nombre), f_unaccent($1)) * 0.5
        + similarity(f_unaccent(coalesce(a.descriptores, '')), f_unaccent($1)) * 0.3) AS relevancia`
    : 'NULL::double precision AS relevancia';

  let ordenSql;
  if (orden === 'fecha') {
    ordenSql = ORDEN_FECHA;
  } else if (orden === 'antiguo') {
    ordenSql = ORDEN_ANTIGUO;
  } else if (orden === 'titulo') {
    ordenSql = ORDEN_TITULO;
  } else if (texto) {
    ordenSql = `relevancia DESC, ${ORDEN_FECHA}`;
  } else {
    ordenSql = ORDEN_FECHA;
  }

  const desplazamiento = (pagina - 1) * porPagina;
  const { rows } = await consultar(
    `SELECT ${columnaRelevancia}, ${COLUMNAS}
       ${RELACIONES}
       ${where}
      ORDER BY ${ordenSql}
      LIMIT ${parametro(porPagina)}
      OFFSET ${parametro(desplazamiento)}`,
    parametros,
  );

  return { total: conteo[0].total, filas: rows };
}

export async function obtenerDocumento(id) {
  const { rows } = await consultar(
    `SELECT ${COLUMNAS} ${RELACIONES} WHERE a.id = $1`,
    [id],
  );
  const documento = rows[0];
  if (!documento) return null;

  const { rows: interesados } = await consultar(
    `SELECT i.nombre, i.documento, ri.rol
       FROM rol_interesado ri
       JOIN interesado i ON i.id = ri.id_interesado
      WHERE ri.id_titulo_escritura = $1
      ORDER BY ri.rol, i.nombre`,
    [documento.id_titulo_escritura],
  );

  return { ...documento, interesados };
}

export async function obtenerArchivo(id) {
  const { rows } = await consultar(
    `SELECT a.ruta_archivo, a.ruta_miniatura, a.formato, te.nombre AS titulo
       FROM archivo a
       JOIN titulo_escritura te ON te.id = a.id_titulo_escritura
      WHERE a.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
