import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const esquemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1).default('siarc_db'),
  DB_USER: z.string().min(1).default('postgres'),
  DB_PASSWORD: z.string().default(''),
  DB_SSL: z
    .string()
    .default('false')
    .transform((valor) => ['true', '1', 'si', 'yes'].includes(valor.toLowerCase())),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRA_EN: z.string().default('8h'),
  BLOQUEO_INTENTOS: z.coerce.number().int().positive().default(5),
  BLOQUEO_MINUTOS: z.coerce.number().int().positive().default(15),
  RUTA_REPOSITORIO: z.string().default('../storage/repositorio'),
  RUTA_FRONTEND: z.string().default('../frontend/dist'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  const detalles = resultado.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`);
  console.error('[siarc-ara] Configuración inválida:\n' + detalles.join('\n'));
  process.exit(1);
}

const env = resultado.data;

export const config = {
  entorno: env.NODE_ENV,
  esProduccion: env.NODE_ENV === 'production',
  puerto: env.PORT,
  baseDeDatos: {
    host: env.DB_HOST,
    puerto: env.DB_PORT,
    base: env.DB_NAME,
    usuario: env.DB_USER,
    contrasena: env.DB_PASSWORD,
    ssl: env.DB_SSL,
  },
  jwt: {
    secreto: env.JWT_SECRET,
    expiraEn: env.JWT_EXPIRA_EN,
  },
  bloqueo: {
    intentosMaximos: env.BLOQUEO_INTENTOS,
    minutosBloqueo: env.BLOQUEO_MINUTOS,
  },
  rutas: {
    repositorio: path.resolve(process.cwd(), env.RUTA_REPOSITORIO),
    frontend: path.resolve(process.cwd(), env.RUTA_FRONTEND),
  },
  corsOrigen: env.CORS_ORIGIN,
};

export default config;
