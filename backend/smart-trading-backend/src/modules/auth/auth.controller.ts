import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import type { RegisterInput, LoginInput, RefreshInput } from './auth.schemas';
import { sendSuccess } from '../../utils/response';

export async function register(
  req: Request<object, object, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.registerUser(req.body);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request<object, object, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request<object, object, RefreshInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.refreshTokens(req.body.refresh_token);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.sub);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
