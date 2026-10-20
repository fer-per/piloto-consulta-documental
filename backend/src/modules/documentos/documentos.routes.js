import { Router } from 'express';
import { autenticar } from '../../middlewares/authenticate.js';
import { autorizar, todosPerfiles } from '../../middlewares/authorize.js';
import { validar } from '../../middlewares/validate.js';
import { esquemaBusquedaAvanzada, esquemaBusquedaSimple, esquemaId } from './documentos.schema.js';
import * as controlador from './documentos.controller.js';

const router = Router();

router.use(autenticar, autorizar(...todosPerfiles));

router.get('/busqueda/simple', validar(esquemaBusquedaSimple, 'query'), controlador.buscarSimple);
router.get('/busqueda/avanzada', validar(esquemaBusquedaAvanzada, 'query'), controlador.buscarAvanzada);
router.get('/:id', validar(esquemaId, 'params'), controlador.obtenerDetalle);
router.get('/:id/archivo', validar(esquemaId, 'params'), controlador.descargarArchivo);
router.get('/:id/miniatura', validar(esquemaId, 'params'), controlador.descargarMiniatura);

export default router;
