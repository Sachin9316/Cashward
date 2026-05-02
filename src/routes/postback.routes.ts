import { Router } from 'express';
import { handleGenericPostback } from '../controllers/postback.controller';

const router = Router();

// Offerwalls usually send GET requests, but POST is also supported
router.get('/generic', handleGenericPostback);
router.post('/generic', handleGenericPostback);

export default router;
