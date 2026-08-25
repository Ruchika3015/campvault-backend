import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/v1/users/register
router.post(
    '/register',
    userController.register
);

// POST /api/v1/users/login
router.post(
    '/login',
    userController.login
);

// GET /api/v1/users/profile
router.get(
    '/profile',
    authenticate,
    userController.getProfile
);

// PUT /api/v1/users/profile
router.put(
    '/profile',
    authenticate,
    userController.updateProfile
);

export default router;