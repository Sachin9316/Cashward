import { Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth.middleware';

export const getBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, coins: user.coins });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
