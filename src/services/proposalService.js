import * as proposalRepository from '../repositories/proposalRepository.js';
import * as jugaadRepository from '../repositories/jugaadRepository.js';
import * as notificationService from './notificationService.js';


// ================================================================
// SUBMIT PROPOSAL / BARGAIN
// ================================================================

export const submitProposal = async (
    jugaadId,
    proposalData,
    user
) => {

    const {
        proposal_message,
        proposed_price,
        estimated_completion
    } = proposalData;


    // ------------------------------------------------------------
    // 1. Find the Jugaad
    // ------------------------------------------------------------

    const jugaad =
        await jugaadRepository.findJugaadById(
            jugaadId
        );


    if (!jugaad) {

        const error =
            new Error(
                'Jugaad not found.'
            );

        error.statusCode = 404;

        throw error;

    }


    // ------------------------------------------------------------
    // 2. User cannot submit proposal on own Jugaad
    // ------------------------------------------------------------

    if (
        jugaad.poster_id.toString() ===
        user.id.toString()
    ) {

        const error =
            new Error(
                'You cannot submit a proposal for your own Jugaad.'
            );

        error.statusCode = 400;

        throw error;

    }


    // ------------------------------------------------------------
    // 3. Jugaad must be open
    // ------------------------------------------------------------

    if (
        jugaad.status !==
        'open'
    ) {

        const error =
            new Error(
                `Cannot submit proposal for a Jugaad that is '${jugaad.status}'.`
            );

        error.statusCode = 400;

        throw error;

    }


    // ------------------------------------------------------------
    // 4. Check existing proposal
    // ------------------------------------------------------------

    const existingProposal =
        await proposalRepository.findProposalByJugaadAndHelper(
            jugaadId,
            user.id
        );


    if (existingProposal) {

        if (
            existingProposal.status ===
            'pending'
        ) {

            const error =
                new Error(
                    'You have already submitted an active proposal for this Jugaad.'
                );

            error.statusCode = 400;

            throw error;

        }


        if (
            existingProposal.status ===
            'accepted'
        ) {

            const error =
                new Error(
                    'Your proposal for this Jugaad has already been accepted.'
                );

            error.statusCode = 400;

            throw error;

        }

    }


    // ------------------------------------------------------------
    // 5. Validate proposed price
    // ------------------------------------------------------------

    const finalPrice =
        proposed_price !== undefined &&
        proposed_price !== null &&
        proposed_price !== ''

            ? parseFloat(
                  proposed_price
              )

            : parseFloat(
                  jugaad.budget
              );


    if (
        !Number.isFinite(
            finalPrice
        ) ||
        finalPrice <= 0
    ) {

        const error =
            new Error(
                'A valid proposed price is required.'
            );

        error.statusCode = 400;

        throw error;

    }


    // ------------------------------------------------------------
    // 6. Validate proposal message
    // ------------------------------------------------------------

    const finalMessage =
        proposal_message &&
        String(
            proposal_message
        ).trim()

            ? String(
                  proposal_message
              ).trim()

            : 'I am interested in helping with this Jugaad.';


    // ------------------------------------------------------------
    // 7. Create proposal
    // ------------------------------------------------------------
    //
    // IMPORTANT:
    //
    // Submitting a proposal does NOT create:
    //
    // - conversation
    // - conversation participant
    // - message
    //
    // Chat is unlocked only after the poster accepts.
    // ------------------------------------------------------------

    const proposal =
        await proposalRepository.createProposal({

            jugaadId,

            helperId:
                user.id,

            proposalMessage:
                finalMessage,

            proposedPrice:
                finalPrice,

            estimatedCompletion:
                estimated_completion
                    ? String(
                          estimated_completion
                      ).trim()
                    : null

        });


    // ------------------------------------------------------------
    // 8. Notify poster
    // ------------------------------------------------------------
    //
    // notificationService checks:
    //
    // proposal_notifications
    //
    // ON  -> notification is created
    // OFF -> notification is skipped
    //
    // Failure to create a notification does not cancel the
    // proposal because the proposal itself was successful.
    // ------------------------------------------------------------

    notificationService.notifyUser({

        userId:
            jugaad.poster_id,

        type:
            'PROPOSAL_RECEIVED',

        title:
            'New Proposal Received',

        message:
            `${user.name || 'A student'} submitted a proposal for "${jugaad.title}" (₹${finalPrice}).`,

        referenceType:
            'jugaad',

        referenceId:
            jugaad.id

    }).catch(
        error =>
            console.error(
                'Notification error:',
                error
            )
    );


    // ------------------------------------------------------------
    // 9. Return proposal
    // ------------------------------------------------------------

    return proposal;

};


// ================================================================
// GET PROPOSALS FOR JUGAAD
// ================================================================

export const getProposalsForJugaad = async (
    jugaadId,
    user
) => {

    const jugaad =
        await jugaadRepository.findJugaadById(
            jugaadId
        );


    if (!jugaad) {

        const error =
            new Error(
                'Jugaad not found.'
            );

        error.statusCode = 404;

        throw error;

    }


    if (
        jugaad.poster_id.toString() !==
        user.id.toString()
    ) {

        const error =
            new Error(
                'Unauthorized: Only the Jugaad owner can view received proposals.'
            );

        error.statusCode = 403;

        throw error;

    }


    return await proposalRepository.findProposalsByJugaadId(
        jugaadId
    );

};


// ================================================================
// MY PROPOSALS
// ================================================================

export const getMyProposals = async (
    user
) => {

    return await proposalRepository.findMyProposals(
        user.id
    );

};


// ================================================================
// RECEIVED PROPOSALS
// ================================================================

export const getReceivedProposals = async (
    user
) => {

    return await proposalRepository.findReceivedProposals(
        user.id
    );

};


// ================================================================
// ACCEPT PROPOSAL
// ================================================================

export const acceptProposal = async (
    proposalId,
    user
) => {

    const result =
        await proposalRepository.acceptProposalTransaction(
            proposalId,
            user.id
        );


    return {

        message:
            'Proposal accepted successfully! Jugaad is now assigned, and a direct conversation has been unlocked.',

        ...result

    };

};


// ================================================================
// REJECT PROPOSAL
// ================================================================

export const rejectProposal = async (
    proposalId,
    user
) => {

    const proposal =
        await proposalRepository.findProposalById(
            proposalId
        );


    if (!proposal) {

        const error =
            new Error(
                'Proposal not found.'
            );

        error.statusCode = 404;

        throw error;

    }


    if (
        proposal.poster_id.toString() !==
        user.id.toString()
    ) {

        const error =
            new Error(
                'Unauthorized: Only the Jugaad owner can reject proposals.'
            );

        error.statusCode = 403;

        throw error;

    }


    if (
        proposal.status !==
        'pending'
    ) {

        const error =
            new Error(
                `Cannot reject proposal with status '${proposal.status}'.`
            );

        error.statusCode = 400;

        throw error;

    }


    const rejected =
        await proposalRepository.rejectProposal(
            proposalId,
            user.id
        );


    // ------------------------------------------------------------
    // Notify helper
    // ------------------------------------------------------------

    notificationService.notifyUser({

        userId:
            proposal.helper_id,

        type:
            'PROPOSAL_REJECTED',

        title:
            'Proposal Rejected',

        message:
            `Your proposal for "${proposal.jugaad_title}" was declined by the poster.`,

        referenceType:
            'jugaad',

        referenceId:
            proposal.jugaad_id

    }).catch(
        error =>
            console.error(
                'Notification error:',
                error
            )
    );


    return rejected;

};


// ================================================================
// WITHDRAW PROPOSAL
// ================================================================

export const withdrawProposal = async (
    proposalId,
    user
) => {

    const proposal =
        await proposalRepository.findProposalById(
            proposalId
        );


    if (!proposal) {

        const error =
            new Error(
                'Proposal not found.'
            );

        error.statusCode = 404;

        throw error;

    }


    if (
        proposal.helper_id.toString() !==
        user.id.toString()
    ) {

        const error =
            new Error(
                'Unauthorized: Only the proposal creator can withdraw this proposal.'
            );

        error.statusCode = 403;

        throw error;

    }


    if (
        proposal.status !==
        'pending'
    ) {

        const error =
            new Error(
                `Cannot withdraw proposal with status '${proposal.status}'.`
            );

        error.statusCode = 400;

        throw error;

    }


    const withdrawn =
        await proposalRepository.withdrawProposal(
            proposalId,
            user.id
        );


    // ------------------------------------------------------------
    // Notify poster
    // ------------------------------------------------------------

    notificationService.notifyUser({

        userId:
            proposal.poster_id,

        type:
            'PROPOSAL_WITHDRAWN',

        title:
            'Proposal Withdrawn',

        message:
            `A helper has withdrawn their proposal for "${proposal.jugaad_title}".`,

        referenceType:
            'jugaad',

        referenceId:
            proposal.jugaad_id

    }).catch(
        error =>
            console.error(
                'Notification error:',
                error
            )
    );


    return withdrawn;

};


// ================================================================
// CREATE COUNTER OFFER
// ================================================================

export const createCounterOffer = async (
    proposalId,
    counterData,
    user
) => {

    const {
        amount,
        message
    } = counterData;


    const proposal =
        await proposalRepository.findProposalById(
            proposalId
        );


    if (!proposal) {

        const error =
            new Error(
                'Proposal not found.'
            );

        error.statusCode = 404;

        throw error;

    }


    const isPoster =
        proposal.poster_id.toString() ===
        user.id.toString();


    const isHelper =
        proposal.helper_id.toString() ===
        user.id.toString();


    if (
        !isPoster &&
        !isHelper
    ) {

        const error =
            new Error(
                'Unauthorized: Only the poster or helper can make a counter-offer.'
            );

        error.statusCode = 403;

        throw error;

    }


    if (
        proposal.status !==
        'pending'
    ) {

        const error =
            new Error(
                `Cannot make a counter-offer on a proposal with status '${proposal.status}'.`
            );

        error.statusCode = 400;

        throw error;

    }


    const parsedAmount =
        parseFloat(
            amount
        );


    if (
        !Number.isFinite(
            parsedAmount
        ) ||
        parsedAmount <= 0
    ) {

        const error =
            new Error(
                'A valid counter-offer amount is required.'
            );

        error.statusCode = 400;

        throw error;

    }


    const counterOffer =
        await proposalRepository.createCounterOffer({

            proposalId,

            offeredBy:
                user.id,

            amount:
                parsedAmount,

            message:
                message
                    ? String(
                          message
                      ).trim()
                    : null

        });


    // ------------------------------------------------------------
    // Notify the other party
    // ------------------------------------------------------------

    const recipientId =
        isPoster
            ? proposal.helper_id
            : proposal.poster_id;


    notificationService.notifyUser({

        userId:
            recipientId,

        type:
            'COUNTER_OFFER_RECEIVED',

        title:
            'New Counter-Offer',

        message:
            `${user.name || 'User'} sent a counter-offer of ₹${parsedAmount} for "${proposal.jugaad_title}".`,

        referenceType:
            'proposal',

        referenceId:
            proposalId

    }).catch(
        error =>
            console.error(
                'Notification error:',
                error
            )
    );


    return counterOffer;

};


// ================================================================
// GET COUNTER OFFERS
// ================================================================

export const getCounterOffers = async (
    proposalId,
    user
) => {

    const proposal =
        await proposalRepository.findProposalById(
            proposalId
        );


    if (!proposal) {

        const error =
            new Error(
                'Proposal not found.'
            );

        error.statusCode = 404;

        throw error;

    }


    const isPoster =
        proposal.poster_id.toString() ===
        user.id.toString();


    const isHelper =
        proposal.helper_id.toString() ===
        user.id.toString();


    if (
        !isPoster &&
        !isHelper
    ) {

        const error =
            new Error(
                'Unauthorized: Only the poster or helper can view counter-offer history.'
            );

        error.statusCode = 403;

        throw error;

    }


    return await proposalRepository.findCounterOffersByProposalId(
        proposalId
    );

};