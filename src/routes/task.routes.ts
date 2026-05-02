import { Router } from 'express';
import { getTasks, completeTask, createDefaultTasks } from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/all', authMiddleware, getTasks);
router.post('/complete', authMiddleware, completeTask);
router.post('/init-defaults', createDefaultTasks);

export default router;
