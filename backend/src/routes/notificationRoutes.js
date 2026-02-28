import express from 'express';
import { getNotificationSummary } from '../controllers/notificationController.js';

const router = express.Router();

// Get notification summary for a user
router.get('/summary/:userId/:userType', getNotificationSummary);

export default router; 