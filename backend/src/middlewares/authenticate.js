import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { consultar } from '../config/database.js';
import { errores } from '../common/errors.js';

export async function autenticar(req, res, next) {
  try {
    const cabecera = req.headers.authorization ?? '';
    const [esquema, token] = cabecera.split(' ');

    if (esquema !== 'Bearer' || !token) {
      throw errores.tokenInvalido();
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secreto);
    } catch {
      throw errores.tokenInvalido();
    }

    const { rows } = await consultar(
      `SELECT id, nombres, apellidos, correo, nombre_usuario, perfil, estado
         FROM usuario
        WHERE id = $1`,
      [payload.sub],
    );

    const usuario = rows[0];
    if (!usuario || usuario.estado !== 'ACTIVO') {
      throw errores.tokenInvalido();
    }

    req.usuario = {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      nombreUsuario: usuario.nombre_usuario,
      perfil: usuario.perfil,
      nombreCompleto: `${usuario.nombres} ${usuario.apellidos}`.trim(),
    };
    next();
  } catch (error) {
    next(error);
  }
}
