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

    return await userRepository.createUser({
        name,
        email: normalizedEmail,
        password_hash: passwordHash,
        role: 'student',
        number,
        location: location || '',
        college_id
    });
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


// ================================================================
// LINKS
// ================================================================

export const getLinks = async (userId) => {
    return await userRepository.getLinksByUserId(
        userId
    );
};


export const addLink = async (
    userId,
    linkData
) => {
    const platform =
        linkData.platform?.trim();

    const url =
        linkData.url?.trim();

    if (!platform) {
        const error = new Error(
            'Platform name is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    if (!url) {
        const error = new Error(
            'Profile URL is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    if (platform.length > 50) {
        const error = new Error(
            'Platform name is too long.'
        );

        error.statusCode = 400;
        throw error;
    }

    return await userRepository.createLink(
        userId,
        {
            platform,
            url
        }
    );
};


export const updateLink = async (
    userId,
    linkId,
    linkData
) => {
    const platform =
        linkData.platform?.trim();

    const url =
        linkData.url?.trim();

    if (!platform) {
        const error = new Error(
            'Platform name is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    if (!url) {
        const error = new Error(
            'Profile URL is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    const updatedLink =
        await userRepository.updateLink(
            userId,
            linkId,
            {
                platform,
                url
            }
        );

    if (!updatedLink) {
        const error = new Error(
            'Link not found.'
        );

        error.statusCode = 404;
        throw error;
    }

    return updatedLink;
};


export const deleteLink = async (
    userId,
    linkId
) => {
    const deletedLink =
        await userRepository.deleteLink(
            userId,
            linkId
        );

    if (!deletedLink) {
        const error = new Error(
            'Link not found.'
        );

        error.statusCode = 404;
        throw error;
    }

    return deletedLink;
};


// ================================================================
// PROJECTS
// ================================================================

export const getProjects = async (userId) => {
    return await userRepository.getProjectsByUserId(
        userId
    );
};


export const addProject = async (
    userId,
    projectData
) => {
    const name =
        projectData.name?.trim();

    if (!name) {
        const error = new Error(
            'Project name is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    if (name.length > 150) {
        const error = new Error(
            'Project name is too long.'
        );

        error.statusCode = 400;
        throw error;
    }

    return await userRepository.createProject(
        userId,
        {
            name,
            description:
                projectData.description?.trim() || null,
            technologies:
                projectData.technologies?.trim() || null,
            github:
                projectData.github?.trim() || null,
            link:
                projectData.link?.trim() || null
        }
    );
};


export const updateProject = async (
    userId,
    projectId,
    projectData
) => {
    const name =
        projectData.name?.trim();

    if (!name) {
        const error = new Error(
            'Project name is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    const updatedProject =
        await userRepository.updateProject(
            userId,
            projectId,
            {
                name,
                description:
                    projectData.description?.trim() || null,
                technologies:
                    projectData.technologies?.trim() || null,
                github:
                    projectData.github?.trim() || null,
                link:
                    projectData.link?.trim() || null
            }
        );

    if (!updatedProject) {
        const error = new Error(
            'Project not found.'
        );

        error.statusCode = 404;
        throw error;
    }

    return updatedProject;
};


export const deleteProject = async (
    userId,
    projectId
) => {
    const deletedProject =
        await userRepository.deleteProject(
            userId,
            projectId
        );

    if (!deletedProject) {
        const error = new Error(
            'Project not found.'
        );

        error.statusCode = 404;
        throw error;
    }

    return deletedProject;
};


// ================================================================
// CERTIFICATIONS & ACHIEVEMENTS
// ================================================================

export const getCertifications = async (
    userId
) => {
    return await userRepository.getCertificationsByUserId(
        userId
    );
};


export const addCertification = async (
    userId,
    certificationData
) => {
    const title =
        certificationData.title?.trim();

    if (!title) {
        const error = new Error(
            'Certification title is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    if (title.length > 200) {
        const error = new Error(
            'Certification title is too long.'
        );

        error.statusCode = 400;
        throw error;
    }

    return await userRepository.createCertification(
        userId,
        {
            title,
            organization:
                certificationData.organization?.trim() || null,
            date:
                certificationData.date?.trim() || null,
            description:
                certificationData.description?.trim() || null,
            credential_url:
                certificationData.credential_url?.trim() || null
        }
    );
};


export const updateCertification = async (
    userId,
    certificationId,
    certificationData
) => {
    const title =
        certificationData.title?.trim();

    if (!title) {
        const error = new Error(
            'Certification title is required.'
        );

        error.statusCode = 400;
        throw error;
    }

    const updatedCertification =
        await userRepository.updateCertification(
            userId,
            certificationId,
            {
                title,
                organization:
                    certificationData.organization?.trim() || null,
                date:
                    certificationData.date?.trim() || null,
                description:
                    certificationData.description?.trim() || null,
                credential_url:
                    certificationData.credential_url?.trim() || null
            }
        );

    if (!updatedCertification) {
        const error = new Error(
            'Certification not found.'
        );

        error.statusCode = 404;
        throw error;
    }

    return updatedCertification;
};


export const deleteCertification = async (
    userId,
    certificationId
) => {
    const deletedCertification =
        await userRepository.deleteCertification(
            userId,
            certificationId
        );

    if (!deletedCertification) {
        const error = new Error(
            'Certification not found.'
        );

        error.statusCode = 404;
        throw error;
    }

    return deletedCertification;
};