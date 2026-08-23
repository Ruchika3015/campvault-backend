import express from 'express';

import * as proposalController from '../controllers/proposalController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// ================================================================
// JUGAAD-SPECIFIC PROPOSALS
// These routes are normally mounted at:
// /api/v1/jugaads
//
// POST /api/v1/jugaads/:id/proposals
// GET  /api/v1/jugaads/:id/proposals
// ================================================================

router.post(
    '/:id/proposals',
    authenticate,
    proposalController.submitProposal
);

router.get(
    '/:id/proposals',
    authenticate,
    proposalController.getProposalsForJugaad
);


// ================================================================
// PROPOSALS
// These routes are normally mounted at:
// /api/v1/proposals
//
// GET  /api/v1/proposals/my
// GET  /api/v1/proposals/received
// PUT  /api/v1/proposals/:id/accept
// PUT  /api/v1/proposals/:id/reject
// PUT  /api/v1/proposals/:id/withdraw
// POST /api/v1/proposals/:id/counter-offer
// GET  /api/v1/proposals/:id/counter-offers
// ================================================================

router.get(
    '/my',
    authenticate,
    proposalController.getMyProposals
);

router.get(
    '/received',
    authenticate,
    proposalController.getReceivedProposals
);

router.put(
    '/:id/accept',
    authenticate,
    proposalController.acceptProposal
);

router.put(
    '/:id/reject',
    authenticate,
    proposalController.rejectProposal
);

router.put(
    '/:id/withdraw',
    authenticate,
    proposalController.withdrawProposal
);

router.post(
    '/:id/counter-offer',
    authenticate,
    proposalController.createCounterOffer
);

router.get(
    '/:id/counter-offers',
    authenticate,
    proposalController.getCounterOffers
);


// ================================================================
// IMPORTANT
// ================================================================

export default router;