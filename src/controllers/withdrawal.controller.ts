import { Response } from 'express';
import User from '../models/User';
import Withdrawal from '../models/Withdrawal';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth.middleware';

const CONVERSION_RATE = 100; // 100 coins = 1 INR
const MIN_WITHDRAWAL_INR = 10; // min 10 INR

export const requestWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { upiId, amountInr } = req.body;
    const userId = req.user?.id;
    
    if (amountInr < MIN_WITHDRAWAL_INR) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is ${MIN_WITHDRAWAL_INR} INR` });
    }

    const coinsRequired = amountInr * CONVERSION_RATE;
    const user = await User.findById(userId);

    if (!user || user.coins < coinsRequired) {
      return res.status(400).json({ success: false, message: 'Insufficient coins' });
    }

    // Deduct coins
    user.coins -= coinsRequired;
    await user.save();

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId,
      upiId,
      amount: amountInr,
      coinsDeducted: coinsRequired,
      status: 'pending'
    });
    await withdrawal.save();

    // Log transaction
    const transaction = new Transaction({
      userId,
      type: 'withdraw',
      amount: coinsRequired,
      source: 'withdrawal',
      status: 'pending'
    });
    await transaction.save();

    res.status(200).json({ success: true, message: 'Withdrawal requested successfully', withdrawal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWithdrawals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const withdrawals = await Withdrawal.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, withdrawals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
