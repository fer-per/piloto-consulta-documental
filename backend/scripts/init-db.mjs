import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import pg from 'pg';
import { generarArchivos } from './generar-archivos.mjs';

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

const esquema = process.env.DB_SCHEMA ?? 'public';
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(esquema)) {
  console.error(`[init-db] Nombre de esquema inválido: ${esquema}`);
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

async function principal() {
  const enEspacio = Date.now();
  await asegurarBaseDeDatos();

  const pool = new Pool({
    ...conexion,
    database: nombreBase,
    options: `-c search_path=${esquema},public`,
  });
  try {
    if (!soloSeed) {
      console.log(`[init-db] Recreando esquema "${esquema}"...`);
      await pool.query(`DROP SCHEMA IF EXISTS ${esquema} CASCADE`);
      await pool.query(`CREATE SCHEMA ${esquema}`);
      await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public');
      await pool.query('CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public');
      await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public');
      console.log(`[init-db] Aplicando esquema (database/schema.sql) en "${esquema}"...`);
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
      const resultado = await generarArchivos(pool, rutaRepositorio);
      console.log(
        `[init-db] Repositorio generado en ${rutaRepositorio} (${resultado.pdfGenerados} PDF/A, ${resultado.tiffGenerados} TIFF, ${resultado.documentos} miniaturas).`,
      );
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
