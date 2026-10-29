import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import {
  subirArchivo,
  tipoContenidoPorExtension,
  usaAlmacenamientoRemoto,
} from '../src/config/almacenamiento.js';

const rutaBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rutaRepositorio = path.resolve(
  rutaBackend,
  process.env.RUTA_REPOSITORIO ?? '../storage/repositorio',
);

async function* recorrer(directorio) {
  const entradas = await fs.readdir(directorio, { withFileTypes: true });
  for (const entrada of entradas) {
    const ruta = path.join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      yield* recorrer(ruta);
    } else if (entrada.isFile() && entrada.name !== '.gitkeep') {
      yield ruta;
    }
  }
}

async function principal() {
  if (!usaAlmacenamientoRemoto) {
    console.error('[storage] ALMACENAMIENTO debe ser "r2" para subir el repositorio.');
    process.exit(1);
  }

  try {
    await fs.access(rutaRepositorio);
  } catch {
    console.error(`[storage] No existe el repositorio local: ${rutaRepositorio}`);
    console.error('[storage] Ejecute primero: npm run db:reset');
    process.exit(1);
  }

  let subidos = 0;
  for await (const ruta of recorrer(rutaRepositorio)) {
    const clave = path.relative(rutaRepositorio, ruta).split(path.sep).join('/');
    await subirArchivo(clave, ruta, tipoContenidoPorExtension(ruta));
    subidos += 1;
    console.log(`[storage] Subido ${clave}`);
  }

  console.log(`[storage] ${subidos} archivo(s) subidos a Cloudflare R2.`);
}

principal().catch((error) => {
  console.error('[storage] Error:', error.message);
  process.exit(1);
});
