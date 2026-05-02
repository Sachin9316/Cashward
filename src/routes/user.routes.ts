import { Router } from 'express';
import { getProfile, applyReferral, getReferralStats, claimDailyBonus, getLeaderboard, spinWheel, getRecentActivity, rewardAd } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.post('/apply-referral', authMiddleware, applyReferral);
router.get('/referral-stats', authMiddleware, getReferralStats);
router.post('/daily-bonus', authMiddleware, claimDailyBonus);
router.get('/leaderboard', authMiddleware, getLeaderboard);
router.get('/recent-activity', authMiddleware, getRecentActivity);
router.post('/spin-wheel', authMiddleware, spinWheel);
router.post('/reward-ad', authMiddleware, rewardAd);

export default router;
