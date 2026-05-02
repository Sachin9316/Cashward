import { Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select('-otp -otpExpiry');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyReferral = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { referralCode } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.referredBy) {
      return res.status(400).json({ success: false, message: 'You have already used a referral code' });
    }

    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.status(400).json({ success: false, message: 'Invalid referral code' });
    }

    if (referrer._id.toString() === userId) {
      return res.status(400).json({ success: false, message: 'You cannot use your own referral code' });
    }

    // Apply referral: Give bonus to both
    const REFERRAL_BONUS = 500; // 500 coins for both

    user.referredBy = referrer.referralCode;
    user.coins += REFERRAL_BONUS;
    await user.save();

    referrer.coins += REFERRAL_BONUS;
    await referrer.save();

    // Log transactions
    await new Transaction({
      userId: user._id,
      type: 'earn',
      amount: REFERRAL_BONUS,
      source: 'referral_bonus',
      status: 'completed'
    }).save();

    await new Transaction({
      userId: referrer._id,
      type: 'earn',
      amount: REFERRAL_BONUS,
      source: 'referral_reward',
      status: 'completed'
    }).save();

    res.status(200).json({ 
      success: true, 
      message: 'Referral code applied successfully! You earned 500 coins.' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReferralStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const referredUsers = await User.find({ referredBy: user.referralCode })
      .select('email coins createdAt')
      .sort({ createdAt: -1 });

    const maskedReferredUsers = referredUsers.map(u => {
      const [name, domain] = u.email.split('@');
      const maskedName = name[0] + '***' + name[name.length - 1];
      return {
        email: `${maskedName}@${domain}`,
        coins: u.coins,
        date: u.createdAt
      };
    });

    res.status(200).json({ 
      success: true, 
      referralCode: user.referralCode,
      totalReferrals: referredUsers.length,
      referredUsers: maskedReferredUsers
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const claimDailyBonus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const now = new Date();
    const DAILY_BONUS_AMOUNT = 50;
    const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

    if (user.lastDailyBonus) {
      const timeSinceLast = now.getTime() - user.lastDailyBonus.getTime();
      if (timeSinceLast < COOLDOWN) {
        const remaining = COOLDOWN - timeSinceLast;
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return res.status(400).json({ 
          success: false, 
          message: `Daily bonus already claimed. Try again in ${hours}h ${minutes}m.` 
        });
      }
    }

    user.coins += DAILY_BONUS_AMOUNT;
    user.lastDailyBonus = now;
    await user.save();

    // Log transaction
    await new Transaction({
      userId,
      type: 'earn',
      amount: DAILY_BONUS_AMOUNT,
      source: 'Daily Bonus',
      status: 'completed'
    }).save();

    res.status(200).json({ 
      success: true, 
      message: `Congratulations! You earned ${DAILY_BONUS_AMOUNT} coins.`,
      newBalance: user.coins
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const topUsers = await User.find({})
      .sort({ coins: -1 })
      .limit(10)
      .select('email coins');

    // Mask emails for privacy (e.g. s***@gmail.com)
    const leaderboard = topUsers.map((user, index) => {
      const [name, domain] = user.email.split('@');
      const maskedName = name[0] + '***' + name[name.length - 1];
      return {
        rank: index + 1,
        email: `${maskedName}@${domain}`,
        coins: user.coins
      };
    });

    res.status(200).json({ success: true, leaderboard });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await Transaction.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'email');

    const formatted = activities.map(act => {
      const email = (act.userId as any)?.email || 'User';
      const [name, domain] = email.split('@');
      const masked = name[0] + '***' + name[name.length - 1];
      
      return {
        id: act._id,
        user: `${masked}@${domain}`,
        amount: act.amount,
        type: act.type,
        source: act.source,
        time: act.createdAt
      };
    });

    res.status(200).json({ success: true, activities: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const spinWheel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const now = new Date();
    const COOLDOWN = 12 * 60 * 60 * 1000; // 12 hours

    if (user.lastSpin) {
      const timeSinceLast = now.getTime() - user.lastSpin.getTime();
      if (timeSinceLast < COOLDOWN) {
        return res.status(400).json({ 
          success: false, 
          message: 'Spin wheel available only once every 12 hours.' 
        });
      }
    }

    const prizes = [10, 20, 0, 50, 100, 5, 15, 0];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    user.coins += prize;
    user.lastSpin = now;
    await user.save();

    if (prize > 0) {
      await new Transaction({
        userId,
        type: 'earn',
        amount: prize,
        source: 'Spin Wheel',
        status: 'completed'
      }).save();
    }

    res.status(200).json({ 
      success: true, 
      prize,
      newBalance: user.coins,
      message: prize > 0 ? `You won ${prize} coins!` : 'Better luck next time!'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rewardAd = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const now = new Date();
    const AD_REWARD_AMOUNT = 10; // 10 coins per ad
    const COOLDOWN = 60 * 1000; // 60 seconds
    const DAILY_LIMIT = 20;

    // Reset daily count if it's a new day
    const today = new Date().setHours(0, 0, 0, 0);
    const lastReset = user.adResetDate ? new Date(user.adResetDate).setHours(0, 0, 0, 0) : 0;

    if (today !== lastReset) {
      user.dailyAdCount = 0;
      user.adResetDate = now;
    }

    // Check daily limit
    if (user.dailyAdCount >= DAILY_LIMIT) {
      return res.status(400).json({ 
        success: false, 
        message: 'Daily limit reached. Try again tomorrow!' 
      });
    }

    // Check cooldown
    if (user.lastAdWatch) {
      const timeSinceLast = now.getTime() - user.lastAdWatch.getTime();
      if (timeSinceLast < COOLDOWN) {
        return res.status(400).json({ 
          success: false, 
          message: `Please wait ${Math.ceil((COOLDOWN - timeSinceLast) / 1000)}s before next ad.` 
        });
      }
    }

    // Award coins
    user.coins += AD_REWARD_AMOUNT;
    user.lastAdWatch = now;
    user.dailyAdCount += 1;
    await user.save();

    // Log transaction
    await new Transaction({
      userId,
      type: 'earn',
      amount: AD_REWARD_AMOUNT,
      source: 'Rewarded Ad',
      status: 'completed'
    }).save();

    res.status(200).json({ 
      success: true, 
      message: `You earned ${AD_REWARD_AMOUNT} coins!`,
      newBalance: user.coins,
      dailyCount: user.dailyAdCount,
      dailyLimit: DAILY_LIMIT
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
