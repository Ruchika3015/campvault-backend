import * as jugaadRepository from '../repositories/jugaadRepository.js';

export const createJugaad = async (jugaadInput, user) => {
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

    const assignedCollegeId = college_id || user.college_id;
    if (!assignedCollegeId) {
        const error = new Error("College ID is required to create a Jugaad.");
        error.statusCode = 400;
        throw error;
    }

    const skillsArray = Array.isArray(required_skills)
        ? required_skills.map(s => String(s).trim()).filter(Boolean)
        : typeof required_skills === 'string'
            ? required_skills.split(',').map(s => s.trim()).filter(Boolean)
            : [];

    const newJugaad = await jugaadRepository.createJugaad({
        posterId: user.id,
        collegeId: assignedCollegeId,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        requiredSkills: skillsArray,
        budget: parseFloat(budget),
        deadline: new Date(deadline),
        priority,
        attachmentUrl: attachment_url ? attachment_url.trim() : null
    });

    return newJugaad;
};

export const getJugaadById = async (id) => {
    const jugaad = await jugaadRepository.findJugaadById(id);
    if (!jugaad) {
        const error = new Error("Jugaad not found.");
        error.statusCode = 404;
        throw error;
    }
    return jugaad;
};

export const updateJugaad = async (id, posterId, updateData) => {
    const existing = await jugaadRepository.findJugaadById(id);
    if (!existing) {
        const error = new Error("Jugaad not found.");
        error.statusCode = 404;
        throw error;
    }

    if (existing.poster_id.toString() !== posterId.toString()) {
        const error = new Error("Unauthorized: Only the creator can edit this Jugaad.");
        error.statusCode = 403;
        throw error;
    }

    if (existing.status !== 'open') {
        const error = new Error(`Cannot edit a Jugaad that is '${existing.status}'.`);
        error.statusCode = 400;
        throw error;
    }

    const skillsArray = updateData.required_skills !== undefined
        ? (Array.isArray(updateData.required_skills)
            ? updateData.required_skills.map(s => String(s).trim()).filter(Boolean)
            : typeof updateData.required_skills === 'string'
                ? updateData.required_skills.split(',').map(s => s.trim()).filter(Boolean)
                : [])
        : undefined;

    const updated = await jugaadRepository.updateJugaad(id, posterId, {
        title: updateData.title?.trim(),
        description: updateData.description?.trim(),
        category: updateData.category?.trim(),
        requiredSkills: skillsArray,
        budget: updateData.budget ? parseFloat(updateData.budget) : undefined,
        deadline: updateData.deadline ? new Date(updateData.deadline) : undefined,
        priority: updateData.priority,
        attachmentUrl: updateData.attachment_url?.trim()
    });

    return updated;
};

export const deleteJugaad = async (id, posterId) => {
    const existing = await jugaadRepository.findJugaadById(id);
    if (!existing) {
        const error = new Error("Jugaad not found.");
        error.statusCode = 404;
        throw error;
    }

    if (existing.poster_id.toString() !== posterId.toString()) {
        const error = new Error("Unauthorized: Only the creator can cancel/delete this Jugaad.");
        error.statusCode = 403;
        throw error;
    }

    if (existing.status !== 'open') {
        const error = new Error(`Cannot cancel a Jugaad that is '${existing.status}'.`);
        error.statusCode = 400;
        throw error;
    }

    const cancelled = await jugaadRepository.cancelOrDeleteJugaad(id, posterId);
    return cancelled;
};

export const getMyJugaads = async (posterId, status) => {
    return await jugaadRepository.findMyJugaads(posterId, status);
};

export const findJugaads = async (queryParams, user) => {
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

    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const skillsArray = skills
        ? (Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim()).filter(Boolean))
        : null;

    const jugaads = await jugaadRepository.findDiscoverableJugaads({
        currentUserId: user.id,
        userCollegeId: user.college_id,
        collegeId: college_id ? parseInt(college_id, 10) : null,
        category: category ? String(category).trim() : null,
        skills: skillsArray,
        search: search ? String(search).trim() : null,
        minBudget: min_budget ? parseFloat(min_budget) : null,
        maxBudget: max_budget ? parseFloat(max_budget) : null,
        limit: parsedLimit,
        offset
    });

    return {
        page: parsedPage,
        limit: parsedLimit,
        count: jugaads.length,
        data: jugaads
    };
};

export const markNotInterested = async (userId, jugaadId) => {
    const jugaad = await jugaadRepository.findJugaadById(jugaadId);
    if (!jugaad) {
        const error = new Error("Jugaad not found.");
        error.statusCode = 404;
        throw error;
    }

    if (jugaad.poster_id.toString() === userId.toString()) {
        const error = new Error("You cannot mark your own Jugaad as not interested.");
        error.statusCode = 400;
        throw error;
    }

    await jugaadRepository.markNotInterested(userId, jugaadId);
    return {
        success: true,
        message: "Jugaad marked as not interested. It will no longer be recommended to you."
    };
};

export const expressInterest = async (userId, jugaadId) => {
    const jugaad = await jugaadRepository.findJugaadById(jugaadId);
    if (!jugaad) {
        const error = new Error("Jugaad not found.");
        error.statusCode = 404;
        throw error;
    }

    if (jugaad.poster_id.toString() === userId.toString()) {
        const error = new Error("You cannot express interest in your own Jugaad.");
        error.statusCode = 400;
        throw error;
    }

    if (jugaad.status !== 'open') {
        const error = new Error(`Cannot express interest in a Jugaad that is '${jugaad.status}'.`);
        error.statusCode = 400;
        throw error;
    }

    return {
        success: true,
        message: "Interest noted! Please submit your proposal explaining why the poster should choose you.",
        jugaad_id: jugaad.id,
        jugaad_title: jugaad.title,
        budget: jugaad.budget,
        deadline: jugaad.deadline
    };
};
