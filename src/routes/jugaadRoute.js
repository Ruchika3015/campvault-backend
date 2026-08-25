import express from 'express';

import * as jugaadController from '../controllers/jugaadController.js';
import * as proposalController from '../controllers/proposalController.js';

import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * ============================================================
 * CREATE JUGAAD
 * ============================================================
 *
 * POST /api/v1/jugaads
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
 * MY JUGAAD POSTS
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
 * SUBMIT PROPOSAL
 * ============================================================
 *
 * POST /api/v1/jugaads/:id/proposals
 *
 * Student submits a proposal/bargain offer
 * for a specific Jugaad.
 */

router.post(
    '/:id/proposals',
    authenticate,
    proposalController.submitProposal
);


/**
 * ============================================================
 * GET PROPOSALS FOR A JUGAAD
 * ============================================================
 *
 * GET /api/v1/jugaads/:id/proposals
 *
 * Poster uses this endpoint to see interested
 * students and their proposals.
 *
 * This route must come before /:id.
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