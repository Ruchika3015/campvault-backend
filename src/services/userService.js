import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import * as userRepository from '../repositories/userRepository.js';
import * as collegeRepository from '../repositories/collegeRepository.js';


// ================================================================
// REGISTER USER
// ================================================================

export const registerUser = async (userData) => {
    const {
        name,
        email,
        password,
        number,
        location,
        college_id
    } = userData;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser =
        await userRepository.findUserByEmail(
            normalizedEmail
        );

    if (existingUser) {
        const error = new Error(
            'Email is already registered.'
        );

        error.statusCode = 409;
        throw error;
    }

    const existingCollege =
        await collegeRepository.findCollegeById(
            college_id
        );

    if (!existingCollege) {
        const error = new Error(
            'The selected college does not exist in CampVault.'
        );

        error.statusCode = 404;
        throw error;
    }

    const passwordHash =
        await bcrypt.hash(password, 10);

    const newUser =
        await userRepository.createUser({
            name,
            email: normalizedEmail,
            password_hash: passwordHash,
            role: 'student',
            number,
            location: location || '',
            college_id
        });

    return newUser;
};


// ================================================================
// LOGIN USER
// ================================================================

export const loginUser = async (loginData) => {
    const {
        email,
        password
    } = loginData;

    const normalizedEmail =
        email.toLowerCase().trim();

    const user =
        await userRepository.findUserByEmail(
            normalizedEmail
        );

    if (!user) {
        return {
            success: false,
            message: 'INVALID_CREDENTIALS'
        };
    }

    const passwordMatches =
        await bcrypt.compare(
            password,
            user.password_hash
        );

    if (!passwordMatches) {
        return {
            success: false,
            message: 'INVALID_CREDENTIALS'
        };
    }

    const token =
        jwt.sign(
            {
                id: user.id,
                role: user.role,
                college_id: user.college_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

    const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        number: user.number,
        location: user.location,
        college_id: user.college_id,
        role: user.role
    };

    return {
        success: true,
        token,
        user: safeUser
    };
};


// ================================================================
// UPDATE USER PROFILE
// ================================================================

export const updateUserProfile = async (
    userId,
    profileData
) => {
    const {
        name,
        email,
        number,
        location,
        college_id
    } = profileData;

    const normalizedEmail =
        email.toLowerCase().trim();

    const existingUser =
        await userRepository.findUserByEmail(
            normalizedEmail
        );

    if (
        existingUser &&
        Number(existingUser.id) !== Number(userId)
    ) {
        const error = new Error(
            'Email is already registered by another user.'
        );

        error.statusCode = 400;
        throw error;
    }

    const existingCollege =
        await collegeRepository.findCollegeById(
            college_id
        );

    if (!existingCollege) {
        const error = new Error(
            'The selected college does not exist in CampVault.'
        );

        error.statusCode = 404;
        throw error;
    }

    const updatedUser =
        await userRepository.updateUserProfile(
            userId,
            {
                name,
                email: normalizedEmail,
                number,
                location,
                college_id
            }
        );

    if (!updatedUser) {
        const error = new Error(
            'User not found.'
        );

        error.statusCode = 404;
        throw error;
    }

    return updatedUser;
};


// ================================================================
// SKILLS
// ================================================================

export const getSkills = async (userId) => {
    return await userRepository.getSkillsByUserId(
        userId
    );
};


export const addSkill = async (
    userId,
    skillData
) => {
    const name =
        skillData.name?.trim();

    if (!name) {
        const error = new Error(
            'Skill name is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    if (name.length > 100) {
        const error = new Error(
            'Skill name is too long.'
        );

        error.statusCode = 400;
        throw error;
    }

    return await userRepository.createSkill(
        userId,
        {
            name,
            category:
                skillData.category?.trim() || null,
            level:
                skillData.level?.trim() || null
        }
    );
};


export const updateSkill = async (
    userId,
    skillId,
    skillData
) => {
    const name =
        skillData.name?.trim();

    if (!name) {
        const error = new Error(
            'Skill name is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    if (name.length > 100) {
        const error = new Error(
            'Skill name is too long.'
        );

        error.statusCode = 400;
        throw error;
    }

    const updatedSkill =
        await userRepository.updateSkill(
            userId,
            skillId,
            {
                name,
                category:
                    skillData.category?.trim() || null,
                level:
                    skillData.level?.trim() || null
            }
        );

    if (!updatedSkill) {
        const error = new Error(
            'Skill not found.'
        );

        error.statusCode = 404;
        throw error;
    }

    return updatedSkill;
};


export const deleteSkill = async (
    userId,
    skillId
) => {
    const deletedSkill =
        await userRepository.deleteSkill(
            userId,
            skillId
        );

    if (!deletedSkill) {
        const error = new Error(
            'Skill not found.'
        );

        error.statusCode = 404;
        throw error;
    }

    return deletedSkill;
};