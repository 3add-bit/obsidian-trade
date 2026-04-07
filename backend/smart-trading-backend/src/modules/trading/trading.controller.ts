import { Request, Response, NextFunction } from 'express';
import * as tradingService from './trading.service';
import type { PlaceTradeInput, TradeHistoryQuery } from './trading.schemas';
import { sendSuccess } from '../../utils/response';

export async function placeTrade(
  req: Request<object, object, PlaceTradeInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await tradingService.executeTrade(req.user!.sub, req.body);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function getTradeHistory(
  req: Request<object, object, object, TradeHistoryQuery>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { trades, total } = await tradingService.getTradeHistory(
      req.user!.sub,
      req.query
    );
    sendSuccess(res, { trades }, 200, {
      total,
      limit: req.query.limit,
      offset: req.query.offset,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTradeById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const trade = await tradingService.getTradeById(req.user!.sub, req.params.id);
    sendSuccess(res, { trade });
  } catch (err) {
    next(err);
  }
}
