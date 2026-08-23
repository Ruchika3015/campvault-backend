import { z } from 'zod';
import * as jugaadService from '../services/jugaadService.js';

// ============================================================================
// HELPERS
// ============================================================================

const normalizeRequiredSkills = (value) => {
    if (value === undefined || value === null || value === '') {
        return [];
    }

    if (Array.isArray(value)) {
        return value
            .map((skill) => String(skill).trim())
            .filter(Boolean);
    }

    if (typeof value === 'string') {
        return value
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean);
    }

    return [];
};

const validDate = (value) => {
    if (typeof value !== 'string' || !value.trim()) {
        return false;
    }

    const timestamp = Date.parse(value);

    return !Number.isNaN(timestamp);
};

// ============================================================================
// CREATE JUGAAD SCHEMA
// ============================================================================

const createJugaadSchema = z.object({
    title: z
        .string()
        .trim()
        .min(3, 'Title must be at least 3 characters')
        .max(255, 'Title cannot exceed 255 characters'),

    description: z
        .string()
        .trim()
        .min(10, 'Description must be at least 10 characters'),

    category: z
        .string()
        .trim()
        .min(2, 'Category must be at least 2 characters'),

    required_skills: z
        .union([
            z.array(z.string()),
            z.string()
        ])
        .optional()
        .default([]),

    budget: z.coerce
        .number()
        .finite('Budget must be a valid number')
        .positive('Budget must be a positive number'),

    deadline: z
        .string()
        .trim()
        .refine(
            validDate,
            'Invalid deadline format. Please select a valid future date.'
        ),

    priority: z
        .enum(['low', 'medium', 'high', 'urgent'])
        .default('medium'),

    attachment_url: z
        .string()
        .trim()
        .max(500, 'Attachment URL cannot exceed 500 characters')
        .optional()
        .nullable(),

    college_id: z
        .coerce
        .number()
        .int()
        .positive()
        .optional()
        .nullable()
});

// ============================================================================
// UPDATE JUGAAD SCHEMA
// ============================================================================

const updateJugaadSchema = z.object({
    title: z
        .string()
        .trim()
        .min(3, 'Title must be at least 3 characters')
        .max(255, 'Title cannot exceed 255 characters')
        .optional(),

    description: z
        .string()
        .trim()
        .min(10, 'Description must be at least 10 characters')
        .optional(),

    category: z
        .string()
        .trim()
        .min(2, 'Category must be at least 2 characters')
        .optional(),

    required_skills: z
        .union([
            z.array(z.string()),
            z.string()
        ])
        .optional(),

    budget: z
        .coerce
        .number()
        .finite('Budget must be a valid number')
        .positive('Budget must be a positive number')
        .optional(),

    deadline: z
        .string()
        .trim()
        .refine(
            validDate,
            'Invalid deadline format.'
        )
        .optional(),

    priority: z
        .enum(['low', 'medium', 'high', 'urgent'])
        .optional(),

    attachment_url: z
        .string()
        .trim()
        .max(500, 'Attachment URL cannot exceed 500 characters')
        .optional()
        .nullable()
});

// ============================================================================
// CREATE JUGAAD
// ============================================================================

export const createJugaad = async (req, res, next) => {
    try {
        console.log('');
        console.log('==========================================');
        console.log('CREATE JUGAAD REQUEST');
        console.log('==========================================');
        console.log('REQ BODY:', req.body);
        console.log('USER:', req.user);

        // ------------------------------------------------------------
        // Validate request
        // ------------------------------------------------------------

        const validation = createJugaadSchema.safeParse(req.body);

        if (!validation.success) {
            console.error(
                'CREATE JUGAAD VALIDATION ERROR:',
                validation.error.issues
            );

            const firstError =
                validation.error.issues[0]?.message ||
                'Validation failed';

            return res.status(400).json({
                success: false,
                error: firstError,
                message: firstError,
                issues: validation.error.issues
            });
        }

        // ------------------------------------------------------------
        // Normalize data
        // ------------------------------------------------------------

        const data = validation.data;

        const requiredSkills = normalizeRequiredSkills(
            data.required_skills
        );

        const budget = Number(data.budget);

        const deadlineDate = new Date(data.deadline);

        // ------------------------------------------------------------
        // Extra safety checks
        // ------------------------------------------------------------

        if (!Number.isFinite(budget) || budget <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Budget must be a valid positive number.'
            });
        }

        if (Number.isNaN(deadlineDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Deadline must be a valid date.'
            });
        }

        // Deadline must not be in the past.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (deadlineDate < today) {
            return res.status(400).json({
                success: false,
                error: 'Deadline cannot be in the past.'
            });
        }

        // ------------------------------------------------------------
        // Final data sent to service
        // ------------------------------------------------------------

        const normalizedData = {
            title: data.title.trim(),

            description: data.description.trim(),

            category: data.category.trim(),

            required_skills: requiredSkills,

            budget,

            // Convert YYYY-MM-DD to an actual ISO timestamp.
            deadline: deadlineDate.toISOString(),

            priority: data.priority || 'medium',

            attachment_url:
                data.attachment_url
                    ? data.attachment_url.trim()
                    : null,

            college_id:
                data.college_id ?? undefined
        };

        console.log('------------------------------------------');
        console.log('NORMALIZED JUGAAD DATA');
        console.log('------------------------------------------');
        console.log('TITLE:', normalizedData.title);
        console.log('CATEGORY:', normalizedData.category);
        console.log(
            'REQUIRED SKILLS:',
            normalizedData.required_skills
        );
        console.log('BUDGET:', normalizedData.budget);
        console.log('DEADLINE:', normalizedData.deadline);
        console.log('PRIORITY:', normalizedData.priority);
        console.log('COLLEGE ID:', normalizedData.college_id);
        console.log('------------------------------------------');

        // ------------------------------------------------------------
        // Create Jugaad
        // ------------------------------------------------------------

        const newJugaad = await jugaadService.createJugaad(
            normalizedData,
            req.user
        );

        console.log('JUGAAD CREATED:', newJugaad);
        console.log('==========================================');
        console.log('');

        return res.status(201).json({
            success: true,
            message: 'Jugaad created successfully',
            data: newJugaad
        });
    } catch (error) {
        console.error('CREATE JUGAAD ERROR:', error);

        return next(error);
    }
};

// ============================================================================
// GET DISCOVERY JUGAADS
// ============================================================================

export const getJugaads = async (req, res, next) => {
    try {
        const result = await jugaadService.findJugaads(
            req.query,
            req.user
        );

        return res.status(200).json({
            success: true,
            page: result.page,
            limit: result.limit,
            count: result.count,
            data: result.data
        });
    } catch (error) {
        return next(error);
    }
};

// ============================================================================
// GET MY JUGAADS
// ============================================================================

export const getMyJugaads = async (req, res, next) => {
    try {
        const { status } = req.query;

        const myJugaads =
            await jugaadService.getMyJugaads(
                req.user.id,
                status
            );

        return res.status(200).json({
            success: true,
            count: myJugaads.length,
            data: myJugaads
        });
    } catch (error) {
        return next(error);
    }
};

// ============================================================================
// GET SINGLE JUGAAD
// ============================================================================

export const getJugaadById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const jugaad =
            await jugaadService.getJugaadById(id);

        return res.status(200).json({
            success: true,
            data: jugaad
        });
    } catch (error) {
        return next(error);
    }
};

// ============================================================================
// UPDATE JUGAAD
// ============================================================================

export const updateJugaad = async (req, res, next) => {
    try {
        const { id } = req.params;

        const validation =
            updateJugaadSchema.safeParse(req.body);

        if (!validation.success) {
            const firstError =
                validation.error.issues[0]?.message ||
                'Validation failed';

            return res.status(400).json({
                success: false,
                error: firstError,
                message: firstError,
                issues: validation.error.issues
            });
        }

        const data = validation.data;

        const normalizedData = {
            ...data,

            required_skills:
                data.required_skills !== undefined
                    ? normalizeRequiredSkills(
                          data.required_skills
                      )
                    : undefined,

            budget:
                data.budget !== undefined
                    ? Number(data.budget)
                    : undefined,

            deadline:
                data.deadline !== undefined
                    ? new Date(data.deadline).toISOString()
                    : undefined
        };

        const updated =
            await jugaadService.updateJugaad(
                id,
                req.user.id,
                normalizedData
            );

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Jugaad could not be updated.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Jugaad updated successfully',
            data: updated
        });
    } catch (error) {
        return next(error);
    }
};

// ============================================================================
// DELETE / CANCEL JUGAAD
// ============================================================================

export const deleteJugaad = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result =
            await jugaadService.deleteJugaad(
                id,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                'Jugaad cancelled/deleted successfully',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};

// ============================================================================
// EXPRESS INTEREST
// ============================================================================

export const expressInterest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result =
            await jugaadService.expressInterest(
                req.user.id,
                id
            );

        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
};

// ============================================================================
// MARK NOT INTERESTED
// ============================================================================

export const markNotInterested = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const result =
            await jugaadService.markNotInterested(
                req.user.id,
                id
            );

        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
};