export const manejar = (controlador) => (req, res, next) =>
  Promise.resolve(controlador(req, res, next)).catch(next);
