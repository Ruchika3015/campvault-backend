import express from 'express';

import * as jugaadController from '../controllers/jugaadController.js';

import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * ============================================================
 * CREATE JUGAAD
 * ============================================================
 */

router.post(
    '/',
    authenticate,
    jugaadController.createJugaad
);


/**
 * ============================================================
 * DISCOVERY FEED
 * ============================================================
 *
 * GET /api/v1/jugaads
 */

router.get(
    '/',
    authenticate,
    jugaadController.findJugaads
);


/**
 * ============================================================
 * MY JUGAADS
 * ============================================================
 *
 * GET /api/v1/jugaads/my
 */

router.get(
    '/my',
    authenticate,
    jugaadController.getMyJugaads
);


/**
 * ============================================================
 * EXPRESS INTEREST
 * ============================================================
 *
 * POST /api/v1/jugaads/:id/interested
 *
 * Student clicks INTERESTED.
 */

router.post(
    '/:id/interested',
    authenticate,
    jugaadController.expressInterest
);


/**
 * ============================================================
 * MARK NOT INTERESTED
 * ============================================================
 *
 * POST /api/v1/jugaads/:id/not-interested
 */

router.post(
    '/:id/not-interested',
    authenticate,
    jugaadController.markNotInterested
);


/**
 * ============================================================
 * JUGAAD-SPECIFIC PROPOSALS
 * ============================================================
 *
 * GET /api/v1/jugaads/:id/proposals
 *
 * Poster uses this to see interested students.
 *
 * IMPORTANT:
 * This route must come BEFORE:
 *
 * /:id
 *
 * so that "proposals" is not interpreted as
 * a Jugaad ID.
 */

router.get(
    '/:id/proposals',
    authenticate,
    jugaadController.getProposalsForJugaad
);


/**
 * ============================================================
 * GET SINGLE JUGAAD
 * ============================================================
 *
 * GET /api/v1/jugaads/:id
 */

router.get(
    '/:id',
    authenticate,
    jugaadController.getJugaadById
);


/**
 * ============================================================
 * UPDATE JUGAAD
 * ============================================================
 *
 * PUT /api/v1/jugaads/:id
 */

router.put(
    '/:id',
    authenticate,
    jugaadController.updateJugaad
);


/**
 * ============================================================
 * DELETE / CANCEL JUGAAD
 * ============================================================
 *
 * DELETE /api/v1/jugaads/:id
 */

router.delete(
    '/:id',
    authenticate,
    jugaadController.deleteJugaad
);


export default router;