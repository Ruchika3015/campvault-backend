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


// ================================================================
// SKILLS
// ================================================================

const skillSchema = z.object({
    name: z
        .string()
        .min(1, 'Skill name is required')
        .max(100, 'Skill name is too long')
        .trim(),

    category: z
        .string()
        .max(50, 'Skill category is too long')
        .optional()
        .default(''),

    level: z
        .string()
        .max(50, 'Skill level is too long')
        .optional()
        .default('')
});


export const getSkills = async (req, res, next) => {
    try {
        const skills =
            await userService.getSkills(req.user.id);

        return res.status(200).json({
            success: true,
            data: skills
        });
    } catch (error) {
        return next(error);
    }
};


export const addSkill = async (req, res, next) => {
    try {
        const validation =
            skillSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid skill data'
            });
        }

        const skill =
            await userService.addSkill(
                req.user.id,
                validation.data
            );

        return res.status(201).json({
            success: true,
            message: 'Skill added successfully',
            data: skill
        });
    } catch (error) {
        return next(error);
    }
};


export const updateSkill = async (req, res, next) => {
    try {
        const validation =
            skillSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid skill data'
            });
        }

        const skill =
            await userService.updateSkill(
                req.user.id,
                req.params.id,
                validation.data
            );

        return res.status(200).json({
            success: true,
            message: 'Skill updated successfully',
            data: skill
        });
    } catch (error) {
        return next(error);
    }
};


export const deleteSkill = async (req, res, next) => {
    try {
        const result =
            await userService.deleteSkill(
                req.user.id,
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: 'Skill deleted successfully',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};


// ================================================================
// LINKS & PROFILES
// ================================================================

const linkSchema = z.object({
    platform: z
        .string()
        .min(1, 'Platform name is required')
        .max(50, 'Platform name is too long')
        .trim(),

    url: z
        .string()
        .min(1, 'Profile URL is required')
        .trim()
});


export const getLinks = async (req, res, next) => {
    try {
        const links =
            await userService.getLinks(req.user.id);

        return res.status(200).json({
            success: true,
            data: links
        });
    } catch (error) {
        return next(error);
    }
};


export const addLink = async (req, res, next) => {
    try {
        const validation =
            linkSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid link data'
            });
        }

        const link =
            await userService.addLink(
                req.user.id,
                validation.data
            );

        return res.status(201).json({
            success: true,
            message: 'Link added successfully',
            data: link
        });
    } catch (error) {
        return next(error);
    }
};


export const updateLink = async (req, res, next) => {
    try {
        const validation =
            linkSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid link data'
            });
        }

        const link =
            await userService.updateLink(
                req.user.id,
                req.params.id,
                validation.data
            );

        return res.status(200).json({
            success: true,
            message: 'Link updated successfully',
            data: link
        });
    } catch (error) {
        return next(error);
    }
};


export const deleteLink = async (req, res, next) => {
    try {
        const result =
            await userService.deleteLink(
                req.user.id,
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: 'Link deleted successfully',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};


// ================================================================
// PROJECTS
// ================================================================

const projectSchema = z.object({
    name: z
        .string()
        .min(1, 'Project name is required')
        .max(150, 'Project name is too long')
        .trim(),

    description: z
        .string()
        .optional()
        .default(''),

    technologies: z
        .string()
        .optional()
        .default(''),

    github: z
        .string()
        .optional()
        .default(''),

    link: z
        .string()
        .optional()
        .default('')
});


export const getProjects = async (req, res, next) => {
    try {
        const projects =
            await userService.getProjects(req.user.id);

        return res.status(200).json({
            success: true,
            data: projects
        });
    } catch (error) {
        return next(error);
    }
};


export const addProject = async (req, res, next) => {
    try {
        const validation =
            projectSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid project data'
            });
        }

        const project =
            await userService.addProject(
                req.user.id,
                validation.data
            );

        return res.status(201).json({
            success: true,
            message: 'Project added successfully',
            data: project
        });
    } catch (error) {
        return next(error);
    }
};


export const updateProject = async (req, res, next) => {
    try {
        const validation =
            projectSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid project data'
            });
        }

        const project =
            await userService.updateProject(
                req.user.id,
                req.params.id,
                validation.data
            );

        return res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        return next(error);
    }
};


export const deleteProject = async (req, res, next) => {
    try {
        const result =
            await userService.deleteProject(
                req.user.id,
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};


// ================================================================
// CERTIFICATIONS & ACHIEVEMENTS
// ================================================================

const certificationSchema = z.object({
    title: z
        .string()
        .min(1, 'Certification title is required')
        .max(200, 'Certification title is too long')
        .trim(),

    organization: z
        .string()
        .optional()
        .default(''),

    date: z
        .string()
        .optional()
        .default(''),

    description: z
        .string()
        .optional()
        .default(''),

    credential_url: z
        .string()
        .optional()
        .default('')
});


export const getCertifications = async (
    req,
    res,
    next
) => {
    try {
        const certifications =
            await userService.getCertifications(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            data: certifications
        });
    } catch (error) {
        return next(error);
    }
};


export const addCertification = async (
    req,
    res,
    next
) => {
    try {
        const validation =
            certificationSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid certification data'
            });
        }

        const certification =
            await userService.addCertification(
                req.user.id,
                validation.data
            );

        return res.status(201).json({
            success: true,
            message:
                'Certification added successfully',
            data: certification
        });
    } catch (error) {
        return next(error);
    }
};


export const updateCertification = async (
    req,
    res,
    next
) => {
    try {
        const validation =
            certificationSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error:
                    validation.error.issues[0]?.message ||
                    'Invalid certification data'
            });
        }

        const certification =
            await userService.updateCertification(
                req.user.id,
                req.params.id,
                validation.data
            );

        return res.status(200).json({
            success: true,
            message:
                'Certification updated successfully',
            data: certification
        });
    } catch (error) {
        return next(error);
    }
};


export const deleteCertification = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await userService.deleteCertification(
                req.user.id,
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message:
                'Certification deleted successfully',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};