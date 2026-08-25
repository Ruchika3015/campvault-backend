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

    // Check if user already exists
    const existingUser =
        await userRepository.findUserByEmail(normalizedEmail);

    if (existingUser) {
        const error = new Error(
            'Email is already registered.'
        );

        error.statusCode = 409;
        throw error;
    }

    // Make sure the selected college exists
    const existingCollege =
        await collegeRepository.findCollegeById(college_id);

    if (!existingCollege) {
        const error = new Error(
            'The selected college does not exist in CampVault.'
        );

        error.statusCode = 404;
        throw error;
    }

    // Hash password
    const passwordHash =
        await bcrypt.hash(password, 10);

    // Create user
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

    // Find user by email
    const user =
        await userRepository.findUserByEmail(
            normalizedEmail
        );

    // User does not exist
    if (!user) {
        return {
            success: false,
            message: 'INVALID_CREDENTIALS'
        };
    }

    // Compare password with stored hash
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

    // Create JWT
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

    // Do not send password hash to frontend
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

    // Check whether the email belongs to another user
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

    // Make sure the selected college exists
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

    // Update the user
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