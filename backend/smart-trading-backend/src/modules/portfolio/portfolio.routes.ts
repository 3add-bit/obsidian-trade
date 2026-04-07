import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { pricesQuerySchema } from './portfolio.schemas';
import * as portfolioController from './portfolio.controller';

const router = Router();

router.use(authenticate);

router.get('/',               validate(pricesQuerySchema, 'query'), portfolioController.getPortfolio);
router.get('/summary',        portfolioController.getSummary);
router.get('/:symbol',        validate(pricesQuerySchema, 'query'), portfolioController.getPosition);

export default router;
