import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema, refreshSchema } from './auth.schemas';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login',    validate(loginSchema),    authController.login);
router.post('/refresh',  validate(refreshSchema),  authController.refresh);
router.get('/me',        authenticate,             authController.me);

export default router;
