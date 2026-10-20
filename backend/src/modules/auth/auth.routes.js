import { Router } from 'express';
import { autenticar } from '../../middlewares/authenticate.js';
import { limitarIntentos } from '../../middlewares/rate-limit.js';
import { validar } from '../../middlewares/validate.js';
import { esquemaLogin } from './auth.schema.js';
import * as controlador from './auth.controller.js';

const router = Router();

router.post('/login', limitarIntentos, validar(esquemaLogin), controlador.iniciarSesion);
router.post('/logout', autenticar, controlador.cerrarSesion);
router.get('/sesion', autenticar, controlador.obtenerSesion);

export default router;
