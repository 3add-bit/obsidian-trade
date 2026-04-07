import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { placeTradeSchema, tradeHistoryQuerySchema } from './trading.schemas';
import * as tradingController from './trading.controller';

const router = Router();

// All trading routes require authentication
router.use(authenticate);

router.post('/',     validate(placeTradeSchema),        tradingController.placeTrade);
router.get('/',      validate(tradeHistoryQuerySchema, 'query'), tradingController.getTradeHistory);
router.get('/:id',   tradingController.getTradeById);

export default router;
