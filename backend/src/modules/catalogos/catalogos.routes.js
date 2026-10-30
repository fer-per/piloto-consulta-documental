import { Router } from 'express';
import { autenticar } from '../../middlewares/authenticate.js';
import { autorizar, todosPerfiles } from '../../middlewares/authorize.js';
import { manejar } from '../../common/async-handler.js';
import * as repositorio from './catalogos.repository.js';

const router = Router();

router.use(autenticar, autorizar(...todosPerfiles));

router.get(
  '/',
  manejar(async (_req, res) => {
    const [fondos, series, tipologias, conservaciones, resumen] = await Promise.all([
      repositorio.listarFondos(),
      repositorio.listarSeries(),
      repositorio.listarTipologias(),
      repositorio.listarConservaciones(),
      repositorio.obtenerResumen(),
    ]);
    res.json({ fondos, series, tipologias, conservaciones, ...resumen });
  }),
);

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
