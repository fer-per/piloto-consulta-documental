import zlib from 'node:zlib';

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(buffers) {
  let crc = 0xffffffff;
  for (const buffer of buffers) {
    for (let i = 0; i < buffer.length; i += 1) {
      crc = TABLA_CRC[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(tipo, datos) {
  const tipoBuf = Buffer.from(tipo, 'latin1');
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32([tipoBuf, datos]), 0);
  return Buffer.concat([largo, tipoBuf, datos, crc]);
}

export function pngDesdePixeles(pixeles, ancho, alto) {
  const firma = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const filas = [];
  for (let y = 0; y < alto; y += 1) {
    filas.push(Buffer.from([0]), pixeles.subarray(y * ancho * 3, (y + 1) * ancho * 3));
  }
  const idat = zlib.deflateSync(Buffer.concat(filas), { level: 9 });

  return Buffer.concat([firma, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

export function tiffDesdePixeles(pixeles, ancho, alto) {
  const cantidadEntradas = 10;
  const desplazamientoIfd = 8;
  const desplazamientoBits = desplazamientoIfd + 2 + cantidadEntradas * 12 + 4;
  const desplazamientoDatos = desplazamientoBits + 6;
  const total = desplazamientoDatos + ancho * alto * 3;

  const buffer = Buffer.alloc(total);
  buffer.write('II', 0, 'latin1');
  buffer.writeUInt16LE(42, 2);
  buffer.writeUInt32LE(desplazamientoIfd, 4);

  const entradas = [
    [256, 4, 1, ancho],
    [257, 4, 1, alto],
    [258, 3, 3, desplazamientoBits],
    [259, 3, 1, 1],
    [262, 3, 1, 2],
    [273, 4, 1, desplazamientoDatos],
    [277, 3, 1, 3],
    [278, 4, 1, alto],
    [279, 4, 1, ancho * alto * 3],
    [284, 3, 1, 1],
  ];

  buffer.writeUInt16LE(entradas.length, desplazamientoIfd);
  entradas.forEach((entrada, indice) => {
    const base = desplazamientoIfd + 2 + indice * 12;
    const [etiqueta, tipo, cantidad, valor] = entrada;
    buffer.writeUInt16LE(etiqueta, base);
    buffer.writeUInt16LE(tipo, base + 2);
    buffer.writeUInt32LE(cantidad, base + 4);
    if (tipo === 3 && cantidad === 1) {
      buffer.writeUInt16LE(valor, base + 8);
    } else {
      buffer.writeUInt32LE(valor, base + 8);
    }
  });
  buffer.writeUInt32LE(0, desplazamientoIfd + 2 + entradas.length * 12);

  buffer.writeUInt16LE(8, desplazamientoBits);
  buffer.writeUInt16LE(8, desplazamientoBits + 2);
  buffer.writeUInt16LE(8, desplazamientoBits + 4);

  pixeles.copy(buffer, desplazamientoDatos);
  return buffer;
}

function pintar(pixeles, ancho, x, y, largo, alto, color) {
  const altoTotal = pixeles.length / (ancho * 3);
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(ancho, Math.round(x + largo));
  const finY = Math.min(altoTotal, Math.round(y + alto));

  for (let fila = y0; fila < finY; fila += 1) {
    for (let columna = x0; columna < x1; columna += 1) {
      const posicion = (fila * ancho + columna) * 3;
      pixeles[posicion] = color[0];
      pixeles[posicion + 1] = color[1];
      pixeles[posicion + 2] = color[2];
    }
  }
}

function crearGenerador(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 0xffffffff;
  };
}

export function dibujarPagina(ancho, alto) {
  const pixeles = Buffer.alloc(ancho * alto * 3);
  const aleatorio = crearGenerador(ancho * 31 + alto);

  pintar(pixeles, ancho, 0, 0, ancho, alto, [250, 247, 239]);

  const margen = Math.round(ancho * 0.07);
  const grosor = Math.max(1, Math.round(ancho * 0.004));
  const colorMarco = [174, 160, 138];
  pintar(pixeles, ancho, margen, margen, ancho - 2 * margen, grosor, colorMarco);
  pintar(pixeles, ancho, margen, alto - margen, ancho - 2 * margen, grosor, colorMarco);
  pintar(pixeles, ancho, margen, margen, grosor, alto - 2 * margen, colorMarco);
  pintar(pixeles, ancho, ancho - margen - grosor, margen, grosor, alto - 2 * margen, colorMarco);

  const bandaY = Math.round(alto * 0.11);
  const bandaAlto = Math.round(alto * 0.075);
  pintar(pixeles, ancho, margen * 2, bandaY, ancho - 4 * margen, bandaAlto, [72, 64, 52]);
  pintar(
    pixeles,
    ancho,
    margen * 3,
    bandaY + bandaAlto * 0.35,
    (ancho - 8 * margen) * 0.62,
    bandaAlto * 0.3,
    [236, 230, 216],
  );

  let y = Math.round(alto * 0.26);
  const altoLinea = Math.max(1, Math.round(alto * 0.011));
  const salto = Math.round(alto * 0.028);
  const anchoUtil = ancho - 4 * margen;
  let enEncabezado = true;

  while (y < alto * 0.88) {
    if (enEncabezado) {
      pintar(pixeles, ancho, margen * 2, y, anchoUtil * (0.3 + aleatorio() * 0.2), altoLinea, [96, 88, 74]);
      enEncabezado = false;
    } else {
      const esPárrafo = aleatorio() < 0.12;
      const anchoLinea = esPárrafo ? anchoUtil * 0.35 : anchoUtil * (0.72 + aleatorio() * 0.28);
      const color = aleatorio() < 0.85 ? [118, 112, 102] : [140, 132, 118];
      pintar(pixeles, ancho, margen * 2, y, anchoLinea, altoLinea, color);
      if (esPárrafo) enEncabezado = true;
    }
    y += salto;
  }

  const selloAncho = Math.round(ancho * 0.18);
  const selloAlto = Math.round(alto * 0.075);
  const selloX = ancho - margen * 3 - selloAncho;
  const selloY = alto - margen * 3 - selloAlto;
  pintar(pixeles, ancho, selloX, selloY, selloAncho, grosor * 2, [150, 70, 60]);
  pintar(pixeles, ancho, selloX, selloY + selloAlto, selloAncho, grosor * 2, [150, 70, 60]);
  pintar(pixeles, ancho, selloX, selloY, grosor * 2, selloAlto, [150, 70, 60]);
  pintar(pixeles, ancho, selloX + selloAncho - grosor * 2, selloY, grosor * 2, selloAlto, [150, 70, 60]);

  return pixeles;
}
