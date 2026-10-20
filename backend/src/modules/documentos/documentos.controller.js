import fs from 'node:fs';
import { manejar } from '../../common/async-handler.js';
import * as servicio from './documentos.service.js';

export const buscarSimple = manejar(async (req, res) => {
  const resultado = await servicio.buscarSimple(req.datos, req.usuario);
  res.json(resultado);
});

export const buscarAvanzada = manejar(async (req, res) => {
  const resultado = await servicio.buscarAvanzada(req.datos, req.usuario);
  res.json(resultado);
});

export const obtenerDetalle = manejar(async (req, res) => {
  const documento = await servicio.obtenerDetalle(req.datos.id, req.usuario);
  res.json({ documento });
});

export const descargarArchivo = manejar(async (req, res, next) => {
  const preparado = await servicio.obtenerArchivo(req.datos.id, req.usuario);
  res.setHeader('Content-Type', preparado.tipoContenido);
  res.setHeader('Content-Disposition', `inline; filename="${preparado.nombre}"`);
  res.setHeader('Cache-Control', 'private, max-age=60');
  const flujo = fs.createReadStream(preparado.rutaAbsoluta);
  flujo.on('error', next);
  flujo.pipe(res);
});

export const descargarMiniatura = manejar(async (req, res, next) => {
  const preparado = await servicio.obtenerMiniatura(req.datos.id, req.usuario);
  res.setHeader('Content-Type', preparado.tipoContenido);
  res.setHeader('Cache-Control', 'private, max-age=300');
  const flujo = fs.createReadStream(preparado.rutaAbsoluta);
  flujo.on('error', next);
  flujo.pipe(res);
});
