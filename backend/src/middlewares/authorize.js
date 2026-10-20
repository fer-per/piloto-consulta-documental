import { errores } from '../common/errors.js';

export const PERFILES = Object.freeze({
  ADMINISTRADOR: 'ADMINISTRADOR',
  ARCHIVISTA: 'ARCHIVISTA',
  USUARIO_EXTERNO: 'USUARIO_EXTERNO',
});

export const todosPerfiles = Object.values(PERFILES);

export function autorizar(...perfilesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(errores.tokenInvalido());
    }
    if (!perfilesPermitidos.includes(req.usuario.perfil)) {
      return next(errores.perfilNoAutorizado());
    }
    return next();
  };
}
