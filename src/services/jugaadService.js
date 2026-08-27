import * as jugaadRepository from '../repositories/jugaadRepository.js';


// ================================================================
// CREATE JUGAAD
// ================================================================

export const createJugaad = async (
    jugaadInput,
    user
) => {
    const {
        title,
        description,
        category,
        required_skills = [],
        budget,
        deadline,
        priority = 'medium',
        attachment_url = null,
        college_id
    } = jugaadInput;


    const assignedCollegeId =
        college_id || user.college_id;


    if (!assignedCollegeId) {
        const error =
            new Error(
                'College ID is required to create a Jugaad.'
            );

        error.statusCode = 400;

        throw error;
    }


    const skillsArray =
        Array.isArray(required_skills)
            ? required_skills
                  .map(
                      (s) =>
                          String(s).trim()
                  )
                  .filter(Boolean)

            : typeof required_skills ===
              'string'
            ? required_skills
                  .split(',')
                  .map(
                      (s) => s.trim()
                  )
                  .filter(Boolean)

            : [];


    const parsedBudget =
        parseFloat(budget);


    if (
        !Number.isFinite(parsedBudget) ||
        parsedBudget <= 0
    ) {
        const error =
            new Error(
                'Budget must be greater than 0.'
            );

        error.statusCode = 400;

        throw error;
    }


    const parsedDeadline =
        new Date(deadline);


    if (
        Number.isNaN(
            parsedDeadline.getTime()
        )
    ) {
        const error =
            new Error(
                'A valid deadline is required.'
            );

        error.statusCode = 400;

        throw error;
    }


    const newJugaad =
        await jugaadRepository.createJugaad({
            posterId:
                user.id,

            collegeId:
                assignedCollegeId,

            title:
                title.trim(),

            description:
                description.trim(),

            category:
                category.trim(),

            requiredSkills:
                skillsArray,

            budget:
                parsedBudget,

            deadline:
                parsedDeadline,

            priority,

            attachmentUrl:
                attachment_url
                    ? attachment_url.trim()
                    : null
        });


    return newJugaad;
};


// ================================================================
// GET JUGAAD BY ID
// ================================================================

export const getJugaadById = async (
    id
) => {

    const jugaad =
        await jugaadRepository.findJugaadById(
            id
        );


    if (!jugaad) {
        const error =
            new Error(
                'Jugaad not found.'
            );

        error.statusCode = 404;

        throw error;
    }


    return jugaad;
};


// ================================================================
// UPDATE JUGAAD
// ================================================================

export const updateJugaad = async (
    id,
    posterId,
    updateData
) => {

    const existing =
        await jugaadRepository.findJugaadById(
            id
        );


    if (!existing) {
        const error =
            new Error(
                'Jugaad not found.'
            );

        error.statusCode = 404;

        throw error;
    }


    if (
        existing.poster_id.toString() !==
        posterId.toString()
    ) {
        const error =
            new Error(
                'Unauthorized: Only the creator can edit this Jugaad.'
            );

        error.statusCode = 403;

        throw error;
    }


    if (
        existing.status !==
        'open'
    ) {
        const error =
            new Error(
                `Cannot edit a Jugaad that is '${existing.status}'.`
            );

        error.statusCode = 400;

        throw error;
    }


    const skillsArray =
        updateData.required_skills !==
        undefined

            ? Array.isArray(
                  updateData.required_skills
              )

                ? updateData.required_skills
                      .map(
                          (s) =>
                              String(
                                  s
                              ).trim()
                      )
                      .filter(Boolean)

                : typeof updateData.required_skills ===
                  'string'

                ? updateData.required_skills
                      .split(',')
                      .map(
                          (s) =>
                              s.trim()
                      )
                      .filter(Boolean)

                : []

            : undefined;


    let parsedBudget;


    if (
        updateData.budget !==
        undefined
    ) {
        parsedBudget =
            parseFloat(
                updateData.budget
            );


        if (
            !Number.isFinite(
                parsedBudget
            ) ||
            parsedBudget <= 0
        ) {
            const error =
                new Error(
                    'Budget must be greater than 0.'
                );

            error.statusCode = 400;

            throw error;
        }
    }


    let parsedDeadline;


    if (
        updateData.deadline
    ) {
        parsedDeadline =
            new Date(
                updateData.deadline
            );


        if (
            Number.isNaN(
                parsedDeadline.getTime()
            )
        ) {
            const error =
                new Error(
                    'A valid deadline is required.'
                );

            error.statusCode = 400;

            throw error;
        }
    }


    const updated =
        await jugaadRepository.updateJugaad(
            id,
            posterId,
            {
                title:
                    updateData.title !==
                    undefined
                        ? updateData.title.trim()
                        : undefined,

                description:
                    updateData.description !==
                    undefined
                        ? updateData.description.trim()
                        : undefined,

                category:
                    updateData.category !==
                    undefined
                        ? updateData.category.trim()
                        : undefined,

                requiredSkills:
                    skillsArray,

                budget:
                    parsedBudget,

                deadline:
                    parsedDeadline,

                priority:
                    updateData.priority,

                attachmentUrl:
                    updateData.attachment_url !==
                    undefined
                        ? updateData
                              .attachment_url
                            ?.trim() ||
                          null
                        : undefined
            }
        );


    return updated;
};


// ================================================================
// DELETE / CANCEL JUGAAD
// ================================================================

export const deleteJugaad = async (
    id,
    posterId
) => {

    const existing =
        await jugaadRepository.findJugaadById(
            id
        );


    if (!existing) {
        const error =
            new Error(
                'Jugaad not found.'
            );

        error.statusCode = 404;

        throw error;
    }


    if (
        existing.poster_id.toString() !==
        posterId.toString()
    ) {
        const error =
            new Error(
                'Unauthorized: Only the creator can cancel/delete this Jugaad.'
            );

        error.statusCode = 403;

        throw error;
    }


    if (
        existing.status !==
        'open'
    ) {
        const error =
            new Error(
                `Cannot cancel a Jugaad that is '${existing.status}'.`
            );

        error.statusCode = 400;

        throw error;
    }


    const cancelled =
        await jugaadRepository.cancelOrDeleteJugaad(
            id,
            posterId
        );


    return cancelled;
};


// ================================================================
// MY JUGAAD POSTS
// ================================================================

export const getMyJugaads = async (
    posterId,
    status
) => {

    return await jugaadRepository.findMyJugaads(
        posterId,
        status
    );
};


// ================================================================
// DISCOVERY FEED
// ================================================================

export const findJugaads = async (
    queryParams,
    user
) => {

    const {
        college_id,
        category,
        skills,
        search,
        min_budget,
        max_budget,
        limit = 20,
        page = 1
    } = queryParams;


    const parsedLimit =
        Math.max(
            1,
            Math.min(
                100,
                parseInt(
                    limit,
                    10
                ) || 20
            )
        );


    const parsedPage =
        Math.max(
            1,
            parseInt(
                page,
                10
            ) || 1
        );


    const offset =
        (parsedPage - 1) *
        parsedLimit;


    const skillsArray =
        skills

            ? Array.isArray(skills)

                ? skills

                : String(skills)
                      .split(',')
                      .map(
                          (s) =>
                              s.trim()
                      )
                      .filter(Boolean)

            : null;


    let parsedMinBudget = null;
    let parsedMaxBudget = null;


    if (
        min_budget !==
            undefined &&
        min_budget !==
            ''
    ) {
        parsedMinBudget =
            parseFloat(
                min_budget
            );


        if (
            !Number.isFinite(
                parsedMinBudget
            )
        ) {
            parsedMinBudget =
                null;
        }
    }


    if (
        max_budget !==
            undefined &&
        max_budget !==
            ''
    ) {
        parsedMaxBudget =
            parseFloat(
                max_budget
            );


        if (
            !Number.isFinite(
                parsedMaxBudget
            )
        ) {
            parsedMaxBudget =
                null;
        }
    }


    const jugaads =
        await jugaadRepository.findDiscoverableJugaads(
            {
                currentUserId:
                    user.id,

                userCollegeId:
                    user.college_id,

                collegeId:
                    college_id
                        ? parseInt(
                              college_id,
                              10
                          )
                        : null,

                category:
                    category
                        ? String(
                              category
                          ).trim()
                        : null,

                skills:
                    skillsArray,

                search:
                    search
                        ? String(
                              search
                          ).trim()
                        : null,

                minBudget:
                    parsedMinBudget,

                maxBudget:
                    parsedMaxBudget,

                limit:
                    parsedLimit,

                offset
            }
        );


    return {
        page:
            parsedPage,

        limit:
            parsedLimit,

        count:
            jugaads.length,

        data:
            jugaads
    };
};


// ================================================================
// MARK NOT INTERESTED
// ================================================================

export const markNotInterested = async (
    userId,
    jugaadId
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
        jugaad.poster_id.toString() ===
        userId.toString()
    ) {
        const error =
            new Error(
                'You cannot mark your own Jugaad as not interested.'
            );

        error.statusCode = 400;

        throw error;
    }


    await jugaadRepository.markNotInterested(
        userId,
        jugaadId
    );


    return {
        success:
            true,

        message:
            'Jugaad marked as not interested. It will no longer be recommended to you.'
    };
};


// ================================================================
// EXPRESS INTEREST
// ================================================================
//
// IMPORTANT:
//
// Student clicks INTERESTED
//          ↓
// Create proposal
//          ↓
// NO conversation
// NO message
//
// Poster accepts proposal
//          ↓
// Conversation is created/reused
//
// ================================================================

export const expressInterest = async (
    userId,
    jugaadId,
    proposalMessage =
        'I am interested in helping with this Jugaad.',
    proposedPrice = null
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


    // ------------------------------------------------------------
    // Creator cannot express interest
    // ------------------------------------------------------------

    if (
        jugaad.poster_id.toString() ===
        userId.toString()
    ) {
        const error =
            new Error(
                'You cannot express interest in your own Jugaad.'
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------------
    // Only open Jugaads can receive interest
    // ------------------------------------------------------------

    if (
        jugaad.status !==
        'open'
    ) {
        const error =
            new Error(
                `Cannot express interest in a Jugaad that is '${jugaad.status}'.`
            );

        error.statusCode = 400;

        throw error;
    }


    // ------------------------------------------------------------
    // Determine proposed price
    // ------------------------------------------------------------

    const finalPrice =
        proposedPrice !== null &&
        proposedPrice !==
            undefined &&
        proposedPrice !== ''

            ? parseFloat(
                  proposedPrice
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
    // Create proposal ONLY
    //
    // IMPORTANT:
    // createInterestProposal() must only insert into
    // jugaad_proposals.
    //
    // It must NOT create:
    // conversations
    // messages
    // conversation_participants
    // ------------------------------------------------------------

    const proposal =
        await jugaadRepository.createInterestProposal(
            userId,
            jugaadId,
            proposalMessage ||
                'I am interested in helping with this Jugaad.',
            finalPrice
        );


    return {
        success:
            true,

        message:
            'Interest noted! Your request has been sent to the Jugaad poster.',

        jugaad_id:
            jugaad.id,

        jugaad_title:
            jugaad.title,

        budget:
            jugaad.budget,

        deadline:
            jugaad.deadline,

        proposal
    };
};


// ================================================================
// GET PROPOSALS FOR A JUGAAD
// ================================================================
//
// Only the poster can view proposals/requests.
// Conversation access is NOT created here.
// ================================================================

export const getProposalsForJugaad = async (
    jugaadId,
    posterId
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
        posterId.toString()
    ) {
        const error =
            new Error(
                'Unauthorized: Only the creator can view interested students.'
            );

        error.statusCode = 403;

        throw error;
    }


    return await jugaadRepository.findProposalsForJugaad(
        jugaadId,
        posterId
    );
};