import { consultar } from '../../config/database.js';

export async function registrarAccion({ idUsuario = null, tipoAccion, descripcion }) {
  try {
    await consultar(
      `INSERT INTO registro_auditoria (id_usuario, tipo_accion, descripcion)
       VALUES ($1, $2, $3)`,
      [idUsuario, tipoAccion, descripcion],
    );
  } catch (error) {
    console.error('[siarc-ara] No se pudo registrar la auditoría:', error.message);
  }
}
