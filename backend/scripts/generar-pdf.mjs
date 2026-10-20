import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function normalizar(texto = '') {
  return texto
    .normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...');
}

function partirLineas(fuente, texto, tamano, anchoMaximo) {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
  const lineas = [];
  let actual = '';

  for (const palabra of palabras) {
    const intento = actual ? `${actual} ${palabra}` : palabra;
    if (fuente.widthOfTextAtSize(intento, tamano) <= anchoMaximo) {
      actual = intento;
    } else {
      if (actual) lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export async function generarPdf({ titulo, alcance, descriptores, folios, fecha, tipologia }) {
  const documento = await PDFDocument.create();
  documento.setProducer('SIARC-ARA');
  documento.setCreator('SIARC-ARA - Archivo Regional de Arequipa');
  documento.setTitle(normalizar(titulo) || 'Documento');

  const normal = await documento.embedFont(StandardFonts.Helvetica);
  const negrita = await documento.embedFont(StandardFonts.HelveticaBold);

  const anchoPagina = 612;
  const altoPagina = 792;
  const margen = 56;
  const anchoUtil = anchoPagina - margen * 2;
  const totalPaginas = Math.max(1, Math.min(Number(folios) || 1, 30));

  const contenido = partirLineas(normal, alcance ?? '', 11, anchoUtil);
  const descriptoresLineas = partirLineas(
    normal,
    `Descriptores: ${descriptores ?? 'sin descriptores'}`,
    9,
    anchoUtil,
  );

  for (let indice = 0; indice < totalPaginas; indice += 1) {
    const pagina = documento.addPage([anchoPagina, altoPagina]);

    pagina.drawText('ARCHIVO REGIONAL DE AREQUIPA', {
      x: margen,
      y: altoPagina - margen,
      size: 9,
      font: negrita,
      color: rgb(0.35, 0.31, 0.25),
    });
    pagina.drawText('SIARC-ARA - Repositorio digital', {
      x: anchoPagina - margen - 130,
      y: altoPagina - margen,
      size: 8,
      font: normal,
      color: rgb(0.45, 0.41, 0.35),
    });
    pagina.drawLine({
      start: { x: margen, y: altoPagina - margen - 8 },
      end: { x: anchoPagina - margen, y: altoPagina - margen - 8 },
      thickness: 0.8,
      color: rgb(0.7, 0.65, 0.58),
    });

    let y = altoPagina - margen - 44;

    if (indice === 0) {
      pagina.drawText(normalizar(titulo).slice(0, 90), {
        x: margen,
        y,
        size: 15,
        font: negrita,
        color: rgb(0.12, 0.1, 0.08),
      });
      y -= 22;
      pagina.drawText(`Tipologia: ${tipologia}   |   Fecha de produccion: ${fecha ?? 's/f'}`, {
        x: margen,
        y,
        size: 9,
        font: normal,
        color: rgb(0.3, 0.27, 0.23),
      });
      y -= 30;

      let paginaContenido = 0;
      for (const linea of contenido) {
        if (y < margen + 70) break;
        pagina.drawText(linea, { x: margen, y, size: 11, font: normal, color: rgb(0.15, 0.13, 0.11) });
        y -= 15;
        paginaContenido += 1;
      }
      const restantes = contenido.slice(paginaContenido);
      y -= 10;
      for (const linea of descriptoresLineas) {
        if (y < margen + 70) break;
        pagina.drawText(linea, { x: margen, y, size: 9, font: normal, color: rgb(0.4, 0.36, 0.3) });
        y -= 13;
      }
      if (restantes.length > 0 && y >= margen + 70) {
        y -= 12;
        pagina.drawText('(continua)', { x: margen, y, size: 9, font: normal, color: rgb(0.4, 0.36, 0.3) });
      }
    } else {
      pagina.drawText(normalizar(titulo).slice(0, 90), {
        x: margen,
        y,
        size: 10,
        font: negrita,
        color: rgb(0.3, 0.27, 0.23),
      });
      y -= 24;
      const renglones = Math.floor((y - margen - 60) / 16);
      for (let i = 0; i < renglones; i += 1) {
        const anchoLinea = anchoUtil * (0.55 + ((i * 37) % 45) / 100);
        pagina.drawRectangle({
          x: margen,
          y: y - i * 16,
          width: anchoLinea,
          height: 6,
          color: rgb(0.78, 0.75, 0.7),
        });
      }
    }

    pagina.drawText(`Folio ${indice + 1} de ${totalPaginas}`, {
      x: anchoPagina / 2 - 40,
      y: margen - 20,
      size: 8,
      font: normal,
      color: rgb(0.45, 0.41, 0.35),
    });
    pagina.drawText('Documento digitalizado - uso institucional', {
      x: margen,
      y: margen - 20,
      size: 8,
      font: normal,
      color: rgb(0.55, 0.5, 0.44),
    });
  }

  return Buffer.from(await documento.save());
}
