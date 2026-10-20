import { Router } from 'express';
import { autenticar } from '../../middlewares/authenticate.js';
import { autorizar, todosPerfiles } from '../../middlewares/authorize.js';
import { manejar } from '../../common/async-handler.js';
import * as repositorio from './catalogos.repository.js';

const router = Router();

router.use(autenticar, autorizar(...todosPerfiles));

router.get(
  '/fondos',
  manejar(async (req, res) => res.json({ fondos: await repositorio.listarFondos() })),
);

router.get(
  '/series',
  manejar(async (req, res) => res.json({ series: await repositorio.listarSeries() })),
);

router.get(
  '/tipologias',
  manejar(async (req, res) => res.json({ tipologias: await repositorio.listarTipologias() })),
);

export default router;
