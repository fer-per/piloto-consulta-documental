import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import pg from 'pg';
import { generarPdf } from './generar-pdf.mjs';
import { dibujarPagina, pngDesdePixeles, tiffDesdePixeles } from './assets.mjs';

const { Client, Pool } = pg;

const argumentos = process.argv.slice(2);
const soloEsquema = argumentos.includes('--solo-esquema');
const soloSeed = argumentos.includes('--solo-seed');

const rutaBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rutaProyecto = path.resolve(rutaBackend, '..');
// Igual que el API (src/config/env.js): RUTA_REPOSITORIO es relativa a `backend/`.
const rutaRepositorio = path.resolve(
  rutaBackend,
  process.env.RUTA_REPOSITORIO ?? '../storage/repositorio',
);

const conexion = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
};

const nombreBase = process.env.DB_NAME ?? 'siarc_db';
if (!/^[A-Za-z0-9_]+$/.test(nombreBase)) {
  console.error(`[init-db] Nombre de base de datos inválido: ${nombreBase}`);
  process.exit(1);
}

function leerSql(nombreArchivo) {
  return fs.readFile(path.join(rutaProyecto, 'database', nombreArchivo), 'utf8');
}

async function asegurarBaseDeDatos() {
  const cliente = new Client({ ...conexion, database: 'postgres' });
  await cliente.connect();
  try {
    const { rows } = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombreBase]);
    if (rows.length === 0) {
      await cliente.query(`CREATE DATABASE ${nombreBase} ENCODING 'UTF8'`);
      console.log(`[init-db] Base de datos "${nombreBase}" creada.`);
    } else {
      console.log(`[init-db] Base de datos "${nombreBase}" existente.`);
    }
  } finally {
    await cliente.end();
  }
}

async function generarArchivos(pool) {
  const { rows } = await pool.query(
    `SELECT a.id, a.formato, a.ruta_archivo, a.ruta_miniatura, a.folios,
            te.nombre AS titulo, a.alcance_contenido, a.descriptores,
            a.fecha_produccion, a.tipologia_documental
       FROM archivo a
       JOIN titulo_escritura te ON te.id = a.id_titulo_escritura
      ORDER BY a.id`,
  );

  const paginaDocumento = dibujarPagina(1240, 1754);
  const paginaMiniatura = dibujarPagina(240, 340);
  let pdfGenerados = 0;
  let tiffGenerados = 0;

  for (const documento of rows) {
    const rutaAbsoluta = path.join(rutaRepositorio, documento.ruta_archivo);
    await fs.mkdir(path.dirname(rutaAbsoluta), { recursive: true });

    if (documento.formato === 'TIFF') {
      await fs.writeFile(rutaAbsoluta, tiffDesdePixeles(paginaDocumento, 1240, 1754));
      tiffGenerados += 1;
    } else {
      await fs.writeFile(
        rutaAbsoluta,
        await generarPdf({
          titulo: documento.titulo,
          alcance: documento.alcance_contenido,
          descriptores: documento.descriptores,
          folios: documento.folios,
          fecha: documento.fecha_produccion,
          tipologia: documento.tipologia_documental,
        }),
      );
      pdfGenerados += 1;
    }

    if (documento.ruta_miniatura) {
      const rutaMiniatura = path.join(rutaRepositorio, documento.ruta_miniatura);
      await fs.mkdir(path.dirname(rutaMiniatura), { recursive: true });
      await fs.writeFile(rutaMiniatura, pngDesdePixeles(paginaMiniatura, 240, 340));
    }
  }

  console.log(
    `[init-db] Repositorio generado en ${rutaRepositorio} (${pdfGenerados} PDF/A, ${tiffGenerados} TIFF, ${rows.length} miniaturas).`,
  );
}

async function principal() {
  const enEspacio = Date.now();
  await asegurarBaseDeDatos();

  const pool = new Pool({ ...conexion, database: nombreBase });
  try {
    if (!soloSeed) {
      console.log('[init-db] Aplicando esquema (database/schema.sql)...');
      await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
      await pool.query('CREATE SCHEMA public');
      await pool.query(await leerSql('schema.sql'));
      console.log('[init-db] Esquema aplicado.');
    }

    if (!soloEsquema) {
      console.log('[init-db] Cargando datos semilla (database/seed.sql)...');
      if (soloSeed) {
        await pool.query('TRUNCATE archivo, registro_auditoria, interesado, responsable_descripcion RESTART IDENTITY CASCADE');
      }
      await pool.query(await leerSql('seed.sql'));
      console.log('[init-db] Datos semilla cargados.');
      await generarArchivos(pool);
    }

    console.log(`[init-db] Proceso finalizado en ${((Date.now() - enEspacio) / 1000).toFixed(1)} s.`);
  } finally {
    await pool.end();
  }
}

principal().catch((error) => {
  console.error('[init-db] Error:', error.message);
  process.exit(1);
});
