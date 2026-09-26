import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import { verifyToken } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', authLimiter, asyncHandler(AuthController.register));
router.post('/login', authLimiter, asyncHandler(AuthController.login));
router.post('/continue', authLimiter, asyncHandler(AuthController.continue));
router.post('/oauth', authLimiter, asyncHandler(AuthController.oauthLogin));
router.post('/refresh', asyncHandler(AuthController.refresh));
router.post('/logout', asyncHandler(AuthController.logout));
router.get('/me', verifyToken, asyncHandler(AuthController.getMe));

export default router;
