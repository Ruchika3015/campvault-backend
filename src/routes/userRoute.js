import express from 'express';

import * as userController from '../controllers/userController.js';

import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();


// ================================================================
// AUTH
// ================================================================

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


// ================================================================
// PROFILE
// ================================================================

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


// ================================================================
// SKILLS
// ================================================================

// GET /api/v1/users/skills
router.get(
    '/skills',
    authenticate,
    userController.getSkills
);


// POST /api/v1/users/skills
router.post(
    '/skills',
    authenticate,
    userController.addSkill
);


// PUT /api/v1/users/skills/:id
router.put(
    '/skills/:id',
    authenticate,
    userController.updateSkill
);


// DELETE /api/v1/users/skills/:id
router.delete(
    '/skills/:id',
    authenticate,
    userController.deleteSkill
);


export default router;