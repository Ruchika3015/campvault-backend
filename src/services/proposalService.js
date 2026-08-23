import * as proposalRepository from '../repositories/proposalRepository.js';
import * as jugaadRepository from '../repositories/jugaadRepository.js';
import * as notificationService from './notificationService.js';

export const submitProposal = async (jugaadId, proposalData, user) => {
    const { proposal_message, proposed_price, estimated_completion } = proposalData;

    const jugaad = await jugaadRepository.findJugaadById(jugaadId);
    if (!jugaad) {
        const error = new Error("Jugaad not found.");
        error.statusCode = 404;
        throw error;
    }

    if (jugaad.poster_id.toString() === user.id.toString()) {
        const error = new Error("You cannot submit a proposal for your own Jugaad.");
        error.statusCode = 400;
        throw error;
    }

    if (jugaad.status !== 'open') {
        const error = new Error(`Cannot submit proposal for a Jugaad that is '${jugaad.status}'.`);
        error.statusCode = 400;
        throw error;
    }

    const existingProposal = await proposalRepository.findProposalByJugaadAndHelper(jugaadId, user.id);
    if (existingProposal) {
        if (existingProposal.status === 'pending') {
            const error = new Error("You have already submitted an active proposal for this Jugaad.");
            error.statusCode = 400;
            throw error;
        } else if (existingProposal.status === 'accepted') {
            const error = new Error("Your proposal for this Jugaad has already been accepted.");
            error.statusCode = 400;
            throw error;
        }
    }

    const proposal = await proposalRepository.createProposal({
        jugaadId,
        helperId: user.id,
        proposalMessage: proposal_message.trim(),
        proposedPrice: parseFloat(proposed_price),
        estimatedCompletion: estimated_completion ? estimated_completion.trim() : null
    });

    // Notify poster
    notificationService.notifyUser({
        userId: jugaad.poster_id,
        type: 'PROPOSAL_RECEIVED',
        title: 'New Proposal Received',
        message: `${user.name || 'A student'} submitted a proposal for "${jugaad.title}" (₹${proposed_price}).`,
        referenceType: 'jugaad',
        referenceId: jugaad.id
    }).catch(err => console.error("Notification error:", err));

    return proposal;
};

export const getProposalsForJugaad = async (jugaadId, user) => {
    const jugaad = await jugaadRepository.findJugaadById(jugaadId);
    if (!jugaad) {
        const error = new Error("Jugaad not found.");
        error.statusCode = 404;
        throw error;
    }

    if (jugaad.poster_id.toString() !== user.id.toString()) {
        const error = new Error("Unauthorized: Only the Jugaad owner can view received proposals.");
        error.statusCode = 403;
        throw error;
    }

    return await proposalRepository.findProposalsByJugaadId(jugaadId);
};

export const getMyProposals = async (user) => {
    return await proposalRepository.findMyProposals(user.id);
};

export const getReceivedProposals = async (user) => {
    return await proposalRepository.findReceivedProposals(user.id);
};

export const acceptProposal = async (proposalId, user) => {
    const result = await proposalRepository.acceptProposalTransaction(proposalId, user.id);
    return {
        message: "Proposal accepted successfully! Jugaad is now assigned, and a direct conversation has been unlocked.",
        ...result
    };
};

export const rejectProposal = async (proposalId, user) => {
    const proposal = await proposalRepository.findProposalById(proposalId);
    if (!proposal) {
        const error = new Error("Proposal not found.");
        error.statusCode = 404;
        throw error;
    }

    if (proposal.poster_id.toString() !== user.id.toString()) {
        const error = new Error("Unauthorized: Only the Jugaad owner can reject proposals.");
        error.statusCode = 403;
        throw error;
    }

    if (proposal.status !== 'pending') {
        const error = new Error(`Cannot reject proposal with status '${proposal.status}'.`);
        error.statusCode = 400;
        throw error;
    }

    const rejected = await proposalRepository.rejectProposal(proposalId, user.id);

    // Notify helper
    notificationService.notifyUser({
        userId: proposal.helper_id,
        type: 'PROPOSAL_REJECTED',
        title: 'Proposal Rejected',
        message: `Your proposal for "${proposal.jugaad_title}" was declined by the poster.`,
        referenceType: 'jugaad',
        referenceId: proposal.jugaad_id
    }).catch(err => console.error("Notification error:", err));

    return rejected;
};

export const withdrawProposal = async (proposalId, user) => {
    const proposal = await proposalRepository.findProposalById(proposalId);
    if (!proposal) {
        const error = new Error("Proposal not found.");
        error.statusCode = 404;
        throw error;
    }

    if (proposal.helper_id.toString() !== user.id.toString()) {
        const error = new Error("Unauthorized: Only the proposal creator can withdraw this proposal.");
        error.statusCode = 403;
        throw error;
    }

    if (proposal.status !== 'pending') {
        const error = new Error(`Cannot withdraw proposal with status '${proposal.status}'.`);
        error.statusCode = 400;
        throw error;
    }

    const withdrawn = await proposalRepository.withdrawProposal(proposalId, user.id);

    // Notify poster
    notificationService.notifyUser({
        userId: proposal.poster_id,
        type: 'PROPOSAL_WITHDRAWN',
        title: 'Proposal Withdrawn',
        message: `A helper has withdrawn their proposal for "${proposal.jugaad_title}".`,
        referenceType: 'jugaad',
        referenceId: proposal.jugaad_id
    }).catch(err => console.error("Notification error:", err));

    return withdrawn;
};

export const createCounterOffer = async (proposalId, counterData, user) => {
    const { amount, message } = counterData;

    const proposal = await proposalRepository.findProposalById(proposalId);
    if (!proposal) {
        const error = new Error("Proposal not found.");
        error.statusCode = 404;
        throw error;
    }

    const isPoster = proposal.poster_id.toString() === user.id.toString();
    const isHelper = proposal.helper_id.toString() === user.id.toString();

    if (!isPoster && !isHelper) {
        const error = new Error("Unauthorized: Only the poster or helper can make a counter-offer.");
        error.statusCode = 403;
        throw error;
    }

    if (proposal.status !== 'pending') {
        const error = new Error(`Cannot make a counter-offer on a proposal with status '${proposal.status}'.`);
        error.statusCode = 400;
        throw error;
    }

    const counterOffer = await proposalRepository.createCounterOffer({
        proposalId,
        offeredBy: user.id,
        amount: parseFloat(amount),
        message: message ? message.trim() : null
    });

    // Notify the other party
    const recipientId = isPoster ? proposal.helper_id : proposal.poster_id;
    notificationService.notifyUser({
        userId: recipientId,
        type: 'COUNTER_OFFER_RECEIVED',
        title: 'New Counter-Offer',
        message: `${user.name || 'User'} sent a counter-offer of ₹${amount} for "${proposal.jugaad_title}".`,
        referenceType: 'proposal',
        referenceId: proposalId
    }).catch(err => console.error("Notification error:", err));

    return counterOffer;
};

export const getCounterOffers = async (proposalId, user) => {
    const proposal = await proposalRepository.findProposalById(proposalId);
    if (!proposal) {
        const error = new Error("Proposal not found.");
        error.statusCode = 404;
        throw error;
    }

    const isPoster = proposal.poster_id.toString() === user.id.toString();
    const isHelper = proposal.helper_id.toString() === user.id.toString();

    if (!isPoster && !isHelper) {
        const error = new Error("Unauthorized: Only the poster or helper can view counter-offer history.");
        error.statusCode = 403;
        throw error;
    }

    return await proposalRepository.findCounterOffersByProposalId(proposalId);
};
