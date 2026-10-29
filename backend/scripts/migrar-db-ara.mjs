import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client, types } = pg;

types.setTypeParser(1082, (valor) => valor);

if (!process.argv.includes('--confirmar')) {
  console.error('[migracion] Este script recrea el esquema "siarc" dentro de DB_ARA.');
  console.error('[migracion] El esquema public original no se modifica.');
  console.error('[migracion] Ejecute: npm run db:migrar-ara -- --confirmar');
  process.exit(1);
}

const rutaBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rutaProyecto = path.resolve(rutaBackend, '..');
const rutaAcervo = path.resolve(
  rutaBackend,
  process.env.RUTA_REPOSITORIO ?? 'C:\\Users\\user\\Music\\ACERVO DOCUMENTAL NUMERO 7',
);

const recortar = (valor, maximo) =>
  valor === null || valor === undefined ? null : String(valor).slice(0, maximo);

function normalizarEstado(valor) {
  const texto = String(valor ?? '').trim().toUpperCase();
  if (texto.startsWith('BUEN')) return 'Bueno';
  if (texto.startsWith('MAL')) return 'Malo';
  return 'Regular';
}

function normalizarFormato(valor) {
  const texto = String(valor ?? '').trim().toUpperCase();
  return texto.includes('TIF') ? 'TIFF' : 'PDF/A';
}

function normalizarSiglo(valor) {
  const numero = Number.parseInt(valor, 10);
  if (!Number.isFinite(numero)) return 1501;
  if (numero >= 1500 && numero <= 2100) return numero;
  if (numero >= 1 && numero <= 99) return (numero - 1) * 100 + 1;
  return 1501;
}

const MESES = {
  ENERO: 1,
  FEBRERO: 2,
  MARZO: 3,
  ABRIL: 4,
  MAYO: 5,
  JUNIO: 6,
  JULIO: 7,
  AGOSTO: 8,
  SEPTIEMBRE: 9,
  OCTUBRE: 10,
  NOVIEMBRE: 11,
  DICIEMBRE: 12,
};

function analizarRuta(rutaArchivo) {
  const partes = String(rutaArchivo ?? '').split(/[\\/]/);
  const indiceRegistro = partes.findIndex((parte) => /^REGISTRO\s/i.test(parte));
  let tipologia = 'ESCRITURA PÚBLICA';
  if (indiceRegistro >= 0 && partes[indiceRegistro + 1]) {
    tipologia = partes[indiceRegistro + 1].trim() || tipologia;
  }

  let mes = null;
  for (const parte of partes) {
    const coincidencia = parte.match(/^(\d{1,2})\.\s*(\p{L}+)$/u);
    if (coincidencia) {
      const numero = Number(coincidencia[1]);
      const nombreMes = coincidencia[2].toUpperCase();
      if (MESES[nombreMes] && numero === MESES[nombreMes]) {
        mes = numero;
        break;
      }
    }
  }

  return { tipologia: recortar(tipologia, 100), mes };
}

const perfilPorRol = {
  1: 'ADMINISTRADOR',
  2: 'ARCHIVISTA',
  3: 'USUARIO_EXTERNO',
};

const cliente = new Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'DB_ARA',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  ssl: ['true', '1', 'si', 'yes'].includes(String(process.env.DB_SSL).toLowerCase())
    ? { rejectUnauthorized: false }
    : false,
});

async function insertar(tabla, columnas, valores) {
  const marcadores = valores.map((_, i) => `$${i + 1}`).join(', ');
  await cliente.query(
    `INSERT INTO siarc.${tabla} (${columnas.join(', ')}) VALUES (${marcadores})`,
    valores,
  );
}

async function principal() {
  await cliente.connect();
  console.log(`[migracion] Conectado a ${process.env.DB_NAME} en ${process.env.DB_HOST}:${process.env.DB_PORT}`);

  try {
    await cliente.query('BEGIN');
    await cliente.query('DROP SCHEMA IF EXISTS siarc CASCADE');
    await cliente.query('CREATE SCHEMA siarc');
    await cliente.query('CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public');
    await cliente.query('CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public');
    await cliente.query('CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public');
    await cliente.query('SET LOCAL search_path TO siarc, public');
    console.log('[migracion] Aplicando database/schema.sql en el esquema siarc...');
    await cliente.query(await fs.readFile(path.join(rutaProyecto, 'database', 'schema.sql'), 'utf8'));

    const repositorios = (await cliente.query('SELECT * FROM public.repositorio ORDER BY idrepositorio')).rows;
    const fondos = (await cliente.query('SELECT * FROM public.fondo ORDER BY idfondo')).rows;
    const escribanos = (await cliente.query('SELECT * FROM public.escribano ORDER BY idescribano')).rows;
    const protocolos = (await cliente.query('SELECT * FROM public.protocolo ORDER BY idprotocolo')).rows;
    const anios = (await cliente.query('SELECT * FROM public.anioprotocolo ORDER BY idanioprotocolo')).rows;
    const registros = (await cliente.query('SELECT * FROM public.registro ORDER BY idregistro')).rows;
    const titulos = (await cliente.query('SELECT * FROM public.tituloescritura ORDER BY idtituloescritura')).rows;
    const interesados = (await cliente.query('SELECT * FROM public.interesado ORDER BY idinteresado')).rows;
    const responsables = (await cliente.query('SELECT * FROM public.responsabledescripcion ORDER BY idresponsable')).rows;
    const usuarios = (await cliente.query('SELECT * FROM public.usuario ORDER BY idusuario')).rows;
    const archivos = (await cliente.query('SELECT * FROM public.archivo ORDER BY idarchivo')).rows;
    const roles = (
      await cliente.query(
        `SELECT a.idtituloescritura, a.idregistro, r.idinteresado,
                string_agg(DISTINCT r.rol, ' / ' ORDER BY r.rol) AS rol
           FROM public.rolinteresado r
           JOIN public.archivo a ON a.idarchivo = r.idarchivo
          GROUP BY 1, 2, 3`,
      )
    ).rows;

    for (const fila of repositorios) {
      await insertar(
        'repositorio',
        ['id', 'siglo', 'numero'],
        [fila.idrepositorio, normalizarSiglo(fila.siglo), recortar(fila.numerorepositorio, 20)],
      );
    }

    for (const fila of fondos) {
      await insertar(
        'fondo',
        ['id', 'id_repositorio', 'denominacion'],
        [fila.idfondo, fila.idrepositorio, recortar(fila.entidad, 200)],
      );
    }

    for (const fila of escribanos) {
      const desde = fila.fechainicioejercicio ? String(fila.fechainicioejercicio).slice(0, 4) : null;
      const hasta = fila.fechafinejercicio ? String(fila.fechafinejercicio).slice(0, 4) : null;
      const periodo = [desde, hasta].filter(Boolean).join('-') || null;
      await insertar(
        'entidad_escribano',
        ['id', 'id_fondo', 'nombre_completo', 'periodo_ejercicio', 'seccion', 'cantidad_protocolos'],
        [
          fila.idescribano,
          fila.idfondo,
          recortar(fila.nombrecompleto, 200),
          recortar(periodo, 100),
          recortar(fila.seccion, 100),
          fila.cantidadprotocolos ?? 0,
        ],
      );
    }

    for (const fila of protocolos) {
      await insertar(
        'protocolo',
        ['id', 'id_fondo', 'id_escribano', 'numero', 'cantidad_registros'],
        [
          fila.idprotocolo,
          fila.idfondo,
          fila.idescribano,
          recortar(fila.numeroprotocolo, 50),
          fila.cantidadregistro ?? 0,
        ],
      );
    }

    for (const fila of anios) {
      await insertar(
        'anio_protocolo',
        ['id', 'id_protocolo', 'anio'],
        [fila.idanioprotocolo, fila.idprotocolo, fila['año']],
      );
    }

    for (const fila of registros) {
      await insertar(
        'registro',
        ['id', 'id_anio_protocolo', 'numero', 'cantidad_documentos'],
        [
          fila.idregistro,
          fila.idanioprotocolo,
          recortar(fila.numeroregistro, 50),
          fila.cantidaddocumentos ?? 0,
        ],
      );
    }

    for (const fila of interesados) {
      await insertar(
        'interesado',
        ['id', 'nombre', 'documento'],
        [fila.idinteresado, recortar(fila.nombrecompleto, 200), null],
      );
    }

    for (const fila of responsables) {
      await insertar(
        'responsable_descripcion',
        ['id', 'nombre_completo', 'cantidad_archivos'],
        [fila.idresponsable, recortar(fila.nombre, 200), 0],
      );
    }

    const hashDemo = bcrypt.hashSync('Admin123!', 10);
    let primerUsuario = null;
    for (const fila of usuarios) {
      const partes = String(fila.nombre || fila.usuario || 'Usuario').trim().split(/\s+/);
      const nombres = recortar(partes.shift() || 'Usuario', 100);
      const apellidos = recortar(partes.join(' ') || 'Sin apellido', 100);
      const correo = recortar(fila.correo || `${fila.usuario}@local`, 150);
      const perfil = perfilPorRol[fila.idrol_usuario] ?? 'USUARIO_EXTERNO';
      await insertar(
        'usuario',
        [
          'id',
          'nombres',
          'apellidos',
          'correo',
          'nombre_usuario',
          'password_hash',
          'perfil',
          'estado',
          'intentos_fallidos',
          'fecha_creacion',
        ],
        [
          fila.idusuario,
          nombres,
          apellidos,
          correo,
          recortar(fila.usuario, 50),
          hashDemo,
          perfil,
          fila.activo ? 'ACTIVO' : 'INACTIVO',
          0,
          fila.fechacreacion ?? new Date(),
        ],
      );
      if (primerUsuario === null) primerUsuario = fila.idusuario;
    }

    const titulosPorId = new Map(titulos.map((fila) => [fila.idtituloescritura, fila]));
    const copiasTitulo = new Map();
    let siguienteTitulo = 0;

    for (const archivo of archivos) {
      const clave = `${archivo.idtituloescritura}:${archivo.idregistro}`;
      if (copiasTitulo.has(clave)) continue;
      siguienteTitulo += 1;
      const titulo = titulosPorId.get(archivo.idtituloescritura);
      const { mes } = analizarRuta(archivo.rutaarchivo);
      copiasTitulo.set(clave, {
        id: siguienteTitulo,
        idRegistro: archivo.idregistro,
        nombre: recortar(titulo?.nombre ?? 'Sin título', 300),
        mes,
      });
    }

    for (const copia of copiasTitulo.values()) {
      await insertar(
        'titulo_escritura',
        ['id', 'id_registro', 'nombre', 'mes'],
        [copia.id, copia.idRegistro, copia.nombre, copia.mes],
      );
    }

    for (const archivo of archivos) {
      const copia = copiasTitulo.get(`${archivo.idtituloescritura}:${archivo.idregistro}`);
      const { tipologia } = analizarRuta(archivo.rutaarchivo);
      const relativa = path.relative(rutaAcervo, archivo.rutaarchivo).split(path.sep).join('/');
      if (relativa.startsWith('..')) {
        throw new Error(`La ruta queda fuera del acervo: ${archivo.rutaarchivo}`);
      }
      const folios = Number(archivo.cantidadfolios);
      await insertar(
        'archivo',
        [
          'id',
          'id_titulo_escritura',
          'id_responsable_descripcion',
          'id_usuario_carga',
          'tipologia_documental',
          'folios',
          'formato',
          'estado_conservacion',
          'alcance_contenido',
          'fecha_produccion',
          'ruta_archivo',
          'observaciones',
          'ubicacion_fisica',
        ],
        [
          archivo.idarchivo,
          copia.id,
          archivo.idresponsable,
          primerUsuario,
          tipologia,
          Number.isFinite(folios) && folios > 0 ? folios : null,
          normalizarFormato(archivo.formato),
          normalizarEstado(archivo.estadoconservacion),
          archivo.alcancecontenido,
          archivo.datacronica,
          recortar(relativa, 500),
          archivo.observaciones,
          recortar(archivo.datatopica, 150),
        ],
      );
    }

    for (const fila of roles) {
      const copia = copiasTitulo.get(`${fila.idtituloescritura}:${fila.idregistro}`);
      if (!copia) continue;
      await insertar(
        'rol_interesado',
        ['id_titulo_escritura', 'id_interesado', 'rol'],
        [copia.id, fila.idinteresado, recortar(fila.rol, 50)],
      );
    }

    await cliente.query(
      `UPDATE siarc.responsable_descripcion rd
          SET cantidad_archivos = (
            SELECT count(*) FROM siarc.archivo a
             WHERE a.id_responsable_descripcion = rd.id
          )`,
    );

    const tablas = [
      ['usuario', 'id'],
      ['registro_auditoria', 'id'],
      ['repositorio', 'id'],
      ['fondo', 'id'],
      ['entidad_escribano', 'id'],
      ['protocolo', 'id'],
      ['anio_protocolo', 'id'],
      ['registro', 'id'],
      ['titulo_escritura', 'id'],
      ['interesado', 'id'],
      ['responsable_descripcion', 'id'],
      ['archivo', 'id'],
    ];

    for (const [tabla, columna] of tablas) {
      await cliente.query(
        `SELECT setval(
           pg_get_serial_sequence('siarc.${tabla}', '${columna}'),
           coalesce(max(${columna}), 1),
           max(${columna}) IS NOT NULL
         ) FROM siarc.${tabla}`,
      );
    }

    await cliente.query('COMMIT');

    const resumen = await cliente.query(
      `SELECT
         (SELECT count(*) FROM siarc.archivo) AS archivos,
         (SELECT count(*) FROM siarc.titulo_escritura) AS titulos,
         (SELECT count(*) FROM siarc.interesado) AS interesados,
         (SELECT count(*) FROM siarc.rol_interesado) AS roles,
         (SELECT count(*) FROM siarc.usuario) AS usuarios`,
    );

    console.log('[migracion] Completada:', resumen.rows[0]);
    console.log('[migracion] Usuario migrado en siarc: admin / Admin123! (solo en el esquema siarc)');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    await cliente.end();
  }
}

principal().catch((error) => {
  console.error('[migracion] Error:', error.message);
  process.exit(1);
});
