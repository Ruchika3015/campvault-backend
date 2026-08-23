import express from 'express';
import * as conversationController from '../controllers/conversationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Get all unlocked conversations for the current user
router.get('/', authenticate, conversationController.getConversations);

// 2. Get messages in a conversation
router.get('/:id/messages', authenticate, conversationController.getMessages);

// 3. Send a message in a conversation
router.post('/:id/messages', authenticate, conversationController.sendMessage);

export default router;
