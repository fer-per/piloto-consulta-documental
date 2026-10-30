import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import pg from 'pg';
import { generarArchivos } from './generar-archivos.mjs';

const { Pool } = pg;

const rutaBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rutaRepositorio = path.resolve(
  rutaBackend,
  process.env.RUTA_REPOSITORIO ?? '../storage/repositorio',
);

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'siarc_db',
});

try {
  const resultado = await generarArchivos(pool, rutaRepositorio);
  console.log(
    `[storage] Repositorio generado en ${rutaRepositorio} (${resultado.pdfGenerados} PDF/A, ${resultado.tiffGenerados} TIFF, ${resultado.documentos} miniaturas).`,
  );
} catch (error) {
  console.error('[storage] Error:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
