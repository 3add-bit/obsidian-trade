import { Request, Response, NextFunction } from 'express';
import * as portfolioService from './portfolio.service';
import type { PricesQuery } from './portfolio.schemas';
import { sendSuccess } from '../../utils/response';

export async function getPortfolio(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prices   = (req.query.prices as unknown as Record<string, number>) ?? {};
    const portfolio = await portfolioService.getPortfolio(req.user!.sub, prices);
    sendSuccess(res, { portfolio });
  } catch (err) {
    next(err);
  }
}

export async function getPosition(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prices   = (req.query.prices as unknown as Record<string, number>) ?? {};
    const position  = await portfolioService.getPosition(
      req.user!.sub,
      req.params.symbol,
      prices
    );
    sendSuccess(res, { position });
  } catch (err) {
    next(err);
  }
}

export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const summary = await portfolioService.getPortfolioSummary(req.user!.sub);
    sendSuccess(res, { summary });
  } catch (err) {
    next(err);
  }
}
