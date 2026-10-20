import { crearApp } from './app.js';
import { config } from './config/env.js';
import { cerrarPool } from './config/database.js';

const app = crearApp();

const servidor = app.listen(config.puerto, () => {
  console.log(`[siarc-ara] API escuchando en http://localhost:${config.puerto} (${config.entorno})`);
});

async function finalizar(codigo) {
  try {
    await cerrarPool();
  } catch (error) {
    console.error('[siarc-ara] Error al cerrar la base de datos:', error.message);
  } finally {
    process.exit(codigo);
  }
}

process.on('SIGINT', () => finalizar(0));
process.on('SIGTERM', () => finalizar(0));

process.on('unhandledRejection', (razon) => {
  console.error('[siarc-ara] Promesa rechazada sin manejar:', razon);
});

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[siarc-ara] El puerto ${config.puerto} ya está en uso.`);
    finalizar(1);
    return;
  }
  throw error;
});
