import { consultar } from '../../config/database.js';

export async function listarFondos() {
  const { rows } = await consultar(
    `SELECT f.id, f.denominacion, rep.numero AS repositorio, rep.siglo
       FROM fondo f
       JOIN repositorio rep ON rep.id = f.id_repositorio
      ORDER BY f.denominacion`,
  );
  return rows;
}

export async function listarSeries() {
  const { rows } = await consultar(
    `SELECT DISTINCT serie
       FROM archivo
      WHERE serie IS NOT NULL AND serie <> ''
      ORDER BY serie`,
  );
  return rows.map((fila) => fila.serie);
}

export async function listarTipologias() {
  const { rows } = await consultar(
    `SELECT DISTINCT tipologia_documental
       FROM archivo
      ORDER BY tipologia_documental`,
  );
  return rows.map((fila) => fila.tipologia_documental);
}
