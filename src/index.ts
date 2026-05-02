import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables before anything else
dotenv.config();

import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import withdrawalRoutes from './routes/withdrawal.routes';
import userRoutes from './routes/user.routes';
import taskRoutes from './routes/task.routes';
import postbackRoutes from './routes/postback.routes';
import { connectDB } from './config/db';

const app = express();

app.use(cors());
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  next();
});

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/postbacks', postbackRoutes);

app.get('/', (req, res) => {
  console.log('Health check / hit from:', req.ip);
  res.send('Reward App API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
