import { Router } from 'express';
import { requestWithdrawal, getWithdrawals } from '../controllers/withdrawal.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/request', authMiddleware, requestWithdrawal);
router.get('/history', authMiddleware, getWithdrawals);

export default router;
