import { Router } from 'express';
import { getBalance, getTransactions } from '../controllers/wallet.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/balance', authMiddleware, getBalance);
router.get('/transactions', authMiddleware, getTransactions);

export default router;
