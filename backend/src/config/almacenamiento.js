import fs from 'node:fs';
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from './env.js';

const { almacenamiento } = config;

export const usaAlmacenamientoRemoto = almacenamiento.remoto;

let clienteR2 = null;

if (almacenamiento.remoto) {
  clienteR2 = new S3Client({
    region: 'auto',
    endpoint: almacenamiento.endpoint,
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: almacenamiento.accessKeyId,
      secretAccessKey: almacenamiento.secretAccessKey,
    },
  });
}

export function normalizarClave(clave) {
  const limpia = String(clave ?? '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  if (almacenamiento.prefijo) {
    return `${almacenamiento.prefijo}/${limpia}`;
  }
  return limpia;
}

function esObjetoInexistente(error) {
  return (
    error?.name === 'NoSuchKey' ||
    error?.name === 'NotFound' ||
    error?.$metadata?.httpStatusCode === 404
  );
}

export async function existeObjeto(clave) {
  try {
    await clienteR2.send(
      new HeadObjectCommand({
        Bucket: almacenamiento.bucket,
        Key: normalizarClave(clave),
      }),
    );
    return true;
  } catch (error) {
    if (esObjetoInexistente(error)) {
      return false;
    }
    throw error;
  }
}

export async function abrirObjeto(clave) {
  const respuesta = await clienteR2.send(
    new GetObjectCommand({
      Bucket: almacenamiento.bucket,
      Key: normalizarClave(clave),
    }),
  );
  return respuesta.Body;
}

export async function subirObjeto(clave, cuerpo, tipoContenido) {
  await clienteR2.send(
    new PutObjectCommand({
      Bucket: almacenamiento.bucket,
      Key: normalizarClave(clave),
      Body: cuerpo,
      ContentType: tipoContenido,
    }),
  );
}

export async function subirArchivo(clave, rutaLocal, tipoContenido) {
  await subirObjeto(clave, fs.createReadStream(rutaLocal), tipoContenido);
}

export function tipoContenidoPorExtension(nombreArchivo) {
  const extension = String(nombreArchivo).toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'tif':
    case 'tiff':
      return 'image/tiff';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}
