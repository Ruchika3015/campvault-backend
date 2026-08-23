import express from 'express';

import * as jugaadController from '../controllers/jugaadController.js';
import * as proposalController from '../controllers/proposalController.js';

import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
// 1. Create a Jugaad
router.post('/', authenticate, jugaadController.createJugaad);

// 2. Discover Jugaads (recommendations, search, filtering)
router.get('/', authenticate, jugaadController.getJugaads);

// 3. Get my posted Jugaads (must come before /:id)
router.get('/my', authenticate, jugaadController.getMyJugaads);

// 4. Get single Jugaad details
router.get('/:id', authenticate, jugaadController.getJugaadById);

// 5. Update Jugaad (poster only)
router.put('/:id', authenticate, jugaadController.updateJugaad);

// 6. Delete / Cancel Jugaad (poster only)
router.delete('/:id', authenticate, jugaadController.deleteJugaad);

// 7. Express interest in Jugaad
router.post('/:id/interested', authenticate, jugaadController.expressInterest);

// 8. Mark Jugaad as not interested
router.post('/:id/not-interested', authenticate, jugaadController.markNotInterested);

// 9. Submit proposal for a Jugaad
router.post('/:id/proposals', authenticate, proposalController.submitProposal);

// 10. Get all proposals received for a Jugaad (poster only)
router.get('/:id/proposals', authenticate, proposalController.getProposalsForJugaad);

export default router;
