import { Response } from 'express';
import Task from '../models/Task';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/auth.middleware';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find({ isActive: true });
    res.status(200).json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.body;

    const task = await Task.findById(taskId);
    if (!task || !task.isActive) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // In a real app: You would verify task completion via postback/callback
    // For now, we simulate completion
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.coins += task.coins;
    await user.save();

    // Log transaction
    await new Transaction({
      userId,
      type: 'earn',
      amount: task.coins,
      source: `Task: ${task.title}`,
      status: 'completed'
    }).save();

    res.status(200).json({ 
      success: true, 
      message: `Congratulations! You earned ${task.coins} coins.`,
      newBalance: user.coins
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin helper to create tasks (for development)
export const createDefaultTasks = async (req: Request, res: Response) => {
  try {
    const count = await Task.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Tasks already exist' });

    const defaults = [
      { title: 'Play Fruit Ninja', description: 'Score 500 points to earn', coins: 150, type: 'game', icon: '🍎' },
      { title: 'Quick Survey', description: 'Complete a 2-minute survey', coins: 300, type: 'survey', icon: '📝' },
      { title: 'Watch Video Ad', description: 'Watch a 30s video to earn', coins: 50, type: 'ad', icon: '📺' },
      { title: 'Install Telegram', description: 'Install and open the app', coins: 500, type: 'app', icon: '📲' },
    ];

    await Task.insertMany(defaults);
    res.status(201).json({ message: 'Default tasks created' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
