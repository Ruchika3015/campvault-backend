import * as userService from '../services/userService.js';
import { z } from 'zod';

// ================================================================
// REGISTER
// ================================================================

const registerSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be of atleast two character'),

    email: z
        .string()
        .email('Please provide valid email')
        .toLowerCase()
        .trim(),

    password: z
        .string()
        .min(6, 'Password must be atleast 6 characters'),

    number: z
        .string()
        .length(10),

    location: z
        .string()
        .optional(),

    college_id: z.coerce.number({
        required_error:
            'College ID is required and must be a number'
    })
});

export const register = async (req, res, next) => {
    try {
        const validation =
            registerSchema.safeParse(req.body);

        if (!validation.success) {
            const firstErrorMessage =
                validation.error.issues[0]?.message ||
                'Validation failed';

            return res.status(400).json({
                error: firstErrorMessage
            });
        }

        const cleanData = validation.data;

        const newUser =
            await userService.registerUser(cleanData);

        return res.status(201).json({
            message: 'User Registered successfully',
            data: newUser
        });
    } catch (error) {
        return next(error);
    }
};

// ================================================================
// LOGIN
// ================================================================

const loginSchema = z.object({
    email: z
        .string()
        .email('Please provide the valid email')
        .toLowerCase()
        .trim(),

    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
});

export const login = async (req, res, next) => {
    try {
        const validation =
            loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid login data'
            });
        }

        const cleanData = validation.data;

        const result =
            await userService.loginUser(cleanData);

        if (
            !result.success &&
            result.message === 'INVALID_CREDENTIALS'
        ) {
            return res.status(401).json({
                error:
                    'Invalid email or password credentials.'
            });
        }

        return res.status(200).json({
            message: 'Login successful',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        return next(error);
    }
};

// ================================================================
// GET PROFILE
// ================================================================

export const getProfile = async (req, res, next) => {
    try {
        return res.status(200).json({
            success: true,
            data: req.user
        });
    } catch (error) {
        return next(error);
    }
};

// ================================================================
// UPDATE PROFILE
// ================================================================

const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long')
        .trim(),

    email: z
        .string()
        .email('Please provide a valid email')
        .toLowerCase()
        .trim(),

    number: z
        .string()
        .regex(
            /^\d{10}$/,
            'Phone number must contain exactly 10 digits'
        ),

    location: z
        .string()
        .max(200, 'Location is too long')
        .optional()
        .default(''),

    college_id: z.coerce.number({
        required_error:
            'College ID is required and must be a number'
    })
});

export const updateProfile = async (req, res, next) => {
    try {
        const validation =
            updateProfileSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid profile data'
            });
        }

        const cleanData = validation.data;

        const updatedUser =
            await userService.updateUserProfile(
                req.user.id,
                cleanData
            );

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        return next(error);
    }
};