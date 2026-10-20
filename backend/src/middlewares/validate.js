export function validar(esquema, origen = 'body') {
  return (req, res, next) => {
    const entrada = req[origen] ?? {};
    const resultado = esquema.safeParse(entrada);

    if (!resultado.success) {
      const detalles = resultado.error.issues.map((asunto) => ({
        campo: asunto.path.join('.') || '(raíz)',
        mensaje: asunto.message,
      }));
      const error = new Error('Los datos de entrada no son válidos.');
      error.estado = 400;
      error.codigo = 'VALIDACION_INVALIDA';
      error.detalles = detalles;
      return next(error);
    }

    req.datos = resultado.data;
    return next();
  };
}
