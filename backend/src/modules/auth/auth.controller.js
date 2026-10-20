import { manejar } from '../../common/async-handler.js';
import * as servicio from './auth.service.js';

export const iniciarSesion = manejar(async (req, res) => {
  const resultado = await servicio.iniciarSesion({ ...req.datos, ip: req.ip });
  res.json(resultado);
});

export const cerrarSesion = manejar(async (req, res) => {
  const resultado = await servicio.cerrarSesion({ usuario: req.usuario, ip: req.ip });
  res.json(resultado);
});

export const obtenerSesion = manejar(async (req, res) => {
  res.json({ usuario: req.usuario });
});
