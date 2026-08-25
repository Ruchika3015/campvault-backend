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


// ================================================================
// LINKS & PROFILES
// ================================================================

// GET /api/v1/users/links
router.get(
    '/links',
    authenticate,
    userController.getLinks
);

// POST /api/v1/users/links
router.post(
    '/links',
    authenticate,
    userController.addLink
);

// PUT /api/v1/users/links/:id
router.put(
    '/links/:id',
    authenticate,
    userController.updateLink
);

// DELETE /api/v1/users/links/:id
router.delete(
    '/links/:id',
    authenticate,
    userController.deleteLink
);


// ================================================================
// PROJECTS
// ================================================================

// GET /api/v1/users/projects
router.get(
    '/projects',
    authenticate,
    userController.getProjects
);

// POST /api/v1/users/projects
router.post(
    '/projects',
    authenticate,
    userController.addProject
);

// PUT /api/v1/users/projects/:id
router.put(
    '/projects/:id',
    authenticate,
    userController.updateProject
);

// DELETE /api/v1/users/projects/:id
router.delete(
    '/projects/:id',
    authenticate,
    userController.deleteProject
);


// ================================================================
// CERTIFICATIONS & ACHIEVEMENTS
// ================================================================

// GET /api/v1/users/certifications
router.get(
    '/certifications',
    authenticate,
    userController.getCertifications
);

// POST /api/v1/users/certifications
router.post(
    '/certifications',
    authenticate,
    userController.addCertification
);

// PUT /api/v1/users/certifications/:id
router.put(
    '/certifications/:id',
    authenticate,
    userController.updateCertification
);

// DELETE /api/v1/users/certifications/:id
router.delete(
    '/certifications/:id',
    authenticate,
    userController.deleteCertification
);


export default router;