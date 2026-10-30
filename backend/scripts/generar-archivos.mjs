import fs from 'node:fs/promises';
import path from 'node:path';
import { generarPdf } from './generar-pdf.mjs';
import { dibujarPagina, pngDesdePixeles, tiffDesdePixeles } from './assets.mjs';

export async function generarArchivos(pool, rutaRepositorio) {
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

  return { documentos: rows.length, pdfGenerados, tiffGenerados };
}
