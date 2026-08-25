import express from 'express';

import * as conversationController
    from '../controllers/conversationController.js';

import { authenticate }
    from '../middleware/authMiddleware.js';

const router = express.Router();


/* ================================================================
   GET ALL CONVERSATIONS
================================================================ */

router.get(
    '/',
    authenticate,
    conversationController.getConversations
);


/* ================================================================
   GET CONVERSATION MESSAGES
================================================================ */

router.get(
    '/:id/messages',
    authenticate,
    conversationController.getMessages
);


/* ================================================================
   SEND MESSAGE
================================================================ */

router.post(
    '/:id/messages',
    authenticate,
    conversationController.sendMessage
);


/* ================================================================
   MARK MESSAGES AS READ
================================================================ */

router.put(
    '/:id/read',
    authenticate,
    conversationController.markMessagesAsRead
);


export default router;