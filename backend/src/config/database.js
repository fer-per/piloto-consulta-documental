import pg from 'pg';
import { config } from './env.js';

const { Pool, types } = pg;

// Los campos DATE se conservan como texto 'AAAA-MM-DD' para evitar zonas horarias.
types.setTypeParser(1082, (valor) => valor);

export const pool = new Pool({
  host: config.baseDeDatos.host,
  port: config.baseDeDatos.puerto,
  database: config.baseDeDatos.base,
  user: config.baseDeDatos.usuario,
  password: config.baseDeDatos.contrasena,
  ssl: config.baseDeDatos.ssl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('[siarc-ara] Error inesperado en el pool de PostgreSQL:', error.message);
});

export function consultar(texto, parametros = []) {
  return pool.query(texto, parametros);
}

export async function cerrarPool() {
  await pool.end();
}
