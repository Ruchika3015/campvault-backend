import { z } from 'zod';
import * as jugaadService from '../services/jugaadService.js';

const createJugaadSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required'),

    description: z
        .string()
        .min(1, 'Description is required'),

    category: z
        .string()
        .min(1, 'Category is required'),

    required_skills: z
        .union([
            z.array(z.string()),
            z.string()
        ])
        .optional(),

    budget: z.coerce
        .number()
        .positive('Budget must be greater than 0'),

    deadline: z
        .string()
        .min(1, 'Deadline is required'),

    priority: z
        .enum([
            'low',
            'medium',
            'high',
            'urgent'
        ])
        .optional(),

    attachment_url: z
        .string()
        .optional()
        .nullable(),

    college_id: z
        .coerce
        .number()
        .optional()
});


const updateJugaadSchema = z.object({
    title: z.string().optional(),

    description: z.string().optional(),

    category: z.string().optional(),

    required_skills: z
        .union([
            z.array(z.string()),
            z.string()
        ])
        .optional(),

    budget: z.coerce
        .number()
        .positive()
        .optional(),

    deadline: z
        .string()
        .optional(),

    priority: z
        .enum([
            'low',
            'medium',
            'high',
            'urgent'
        ])
        .optional(),

    attachment_url: z
        .string()
        .optional()
        .nullable()
});


/**
 * ============================================================
 * CREATE JUGAAD
 * ============================================================
 */

export const createJugaad = async (
    req,
    res,
    next
) => {
    try {
        const validation =
            createJugaadSchema.safeParse(
                req.body
            );

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error
                        .issues[0]?.message ||
                    'Validation failed',

                issues:
                    validation.error.issues
            });
        }

        const jugaad =
            await jugaadService.createJugaad(
                validation.data,
                req.user
            );

        return res.status(201).json({
            success: true,
            message:
                'Jugaad created successfully.',
            data: jugaad
        });
    } catch (error) {
        return next(error);
    }
};


/**
 * ============================================================
 * GET JUGAAD BY ID
 * ============================================================
 */

export const getJugaadById = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const jugaad =
            await jugaadService.getJugaadById(
                id
            );

        return res.status(200).json({
            success: true,
            data: jugaad
        });
    } catch (error) {
        return next(error);
    }
};


/**
 * ============================================================
 * GET MY JUGAAD POSTS
 * ============================================================
 */

export const getMyJugaads = async (
    req,
    res,
    next
) => {
    try {
        const { status } = req.query;

        const jugaads =
            await jugaadService.getMyJugaads(
                req.user.id,
                status
            );

        return res.status(200).json({
            success: true,
            count: jugaads.length,
            data: jugaads
        });
    } catch (error) {
        return next(error);
    }
};


/**
 * ============================================================
 * DISCOVERY FEED
 * ============================================================
 */

export const findJugaads = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await jugaadService.findJugaads(
                req.query,
                req.user
            );

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        return next(error);
    }
};


/**
 * ============================================================
 * UPDATE JUGAAD
 * ============================================================
 */

export const updateJugaad = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;

        const validation =
            updateJugaadSchema.safeParse(
                req.body
            );

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error
                        .issues[0]?.message ||
                    'Validation failed',

                issues:
                    validation.error.issues
            });
        }

        const updated =
            await jugaadService.updateJugaad(
                id,
                req.user.id,
                validation.data
            );

        return res.status(200).json({
            success: true,
            message:
                'Jugaad updated successfully.',
            data: updated
        });
    } catch (error) {
        return next(error);
    }
};


/**
 * ============================================================
 * DELETE / CANCEL JUGAAD
 * ============================================================
 */

export const deleteJugaad = async (
    req,
    res,
    next
) => {
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
                'Jugaad cancelled successfully.',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};


/**
 * ============================================================
 * EXPRESS INTEREST
 * ============================================================
 *
 * Student clicks:
 *
 * INTERESTED
 *
 * This now creates a pending proposal in
 * jugaad_proposals.
 */

export const expressInterest = async (
    req,
    res,
    next
) => {
    try {
        const {
            id: jugaadId
        } = req.params;

        const proposal =
            await jugaadService.expressInterest(
                req.user.id,
                jugaadId
            );

        return res.status(201).json({
            success: true,

            message:
                proposal.message,

            data:
                proposal
        });
    } catch (error) {
        return next(error);
    }
};


/**
 * ============================================================
 * MARK NOT INTERESTED
 * ============================================================
 */

export const markNotInterested = async (
    req,
    res,
    next
) => {
    try {
        const {
            id: jugaadId
        } = req.params;

        const result =
            await jugaadService.markNotInterested(
                req.user.id,
                jugaadId
            );

        return res.status(200).json(
            result
        );
    } catch (error) {
        return next(error);
    }
};


/**
 * ============================================================
 * GET PROPOSALS FOR A JUGAAD
 * ============================================================
 *
 * Poster uses this endpoint to see:
 *
 * INTERESTED STUDENTS
 *
 * The endpoint only allows the Jugaad owner
 * to view these requests.
 */

export const getProposalsForJugaad = async (
    req,
    res,
    next
) => {
    try {
        const {
            id: jugaadId
        } = req.params;

        const proposals =
            await jugaadService.getProposalsForJugaad(
                jugaadId,
                req.user.id
            );

        return res.status(200).json({
            success: true,

            count:
                proposals.length,

            data:
                proposals
        });
    } catch (error) {
        return next(error);
    }
};