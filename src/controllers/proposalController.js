import { z } from 'zod';
import * as proposalService from '../services/proposalService.js';

const submitProposalSchema = z.object({
    proposal_message: z.string().min(5, "Proposal message must be at least 5 characters explaining why you should be chosen"),
    proposed_price: z.coerce.number().positive("Proposed price must be a positive number"),
    estimated_completion: z.string().max(100).optional().nullable()
});

const counterOfferSchema = z.object({
    amount: z.coerce.number().positive("Counter offer amount must be a positive number"),
    message: z.string().max(500).optional().nullable()
});

export const submitProposal = async (req, res, next) => {
    try {
        const { id: jugaadId } = req.params;
        const validation = submitProposalSchema.safeParse(req.body);
        if (!validation.success) {
            const firstErrorMessage = validation.error.issues[0]?.message || "Validation failed";
            return res.status(400).json({ error: firstErrorMessage, issues: validation.error.issues });
        }

        const proposal = await proposalService.submitProposal(jugaadId, validation.data, req.user);
        return res.status(201).json({
            success: true,
            message: "Proposal submitted successfully",
            data: proposal
        });
    } catch (error) {
        return next(error);
    }
};

export const getProposalsForJugaad = async (req, res, next) => {
    try {
        const { id: jugaadId } = req.params;
        const proposals = await proposalService.getProposalsForJugaad(jugaadId, req.user);
        return res.status(200).json({
            success: true,
            count: proposals.length,
            data: proposals
        });
    } catch (error) {
        return next(error);
    }
};

export const getMyProposals = async (req, res, next) => {
    try {
        const proposals = await proposalService.getMyProposals(req.user);
        return res.status(200).json({
            success: true,
            count: proposals.length,
            data: proposals
        });
    } catch (error) {
        return next(error);
    }
};

export const getReceivedProposals = async (req, res, next) => {
    try {
        const proposals = await proposalService.getReceivedProposals(req.user);
        return res.status(200).json({
            success: true,
            count: proposals.length,
            data: proposals
        });
    } catch (error) {
        return next(error);
    }
};

export const acceptProposal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await proposalService.acceptProposal(id, req.user);
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        return next(error);
    }
};

export const rejectProposal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await proposalService.rejectProposal(id, req.user);
        return res.status(200).json({
            success: true,
            message: "Proposal rejected",
            data: result
        });
    } catch (error) {
        return next(error);
    }
};

export const withdrawProposal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await proposalService.withdrawProposal(id, req.user);
        return res.status(200).json({
            success: true,
            message: "Proposal withdrawn successfully",
            data: result
        });
    } catch (error) {
        return next(error);
    }
};

export const createCounterOffer = async (req, res, next) => {
    try {
        const { id: proposalId } = req.params;
        const validation = counterOfferSchema.safeParse(req.body);
        if (!validation.success) {
            const firstErrorMessage = validation.error.issues[0]?.message || "Validation failed";
            return res.status(400).json({ error: firstErrorMessage, issues: validation.error.issues });
        }

        const counterOffer = await proposalService.createCounterOffer(proposalId, validation.data, req.user);
        return res.status(201).json({
            success: true,
            message: "Counter-offer submitted successfully",
            data: counterOffer
        });
    } catch (error) {
        return next(error);
    }
};

export const getCounterOffers = async (req, res, next) => {
    try {
        const { id: proposalId } = req.params;
        const history = await proposalService.getCounterOffers(proposalId, req.user);
        return res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        return next(error);
    }
};
