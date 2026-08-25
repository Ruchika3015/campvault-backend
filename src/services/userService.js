export const updateUserProfile = async (userId, profileData) => {
    const {
        name,
        email,
        number,
        location,
        college_id
    } = profileData;

    // Check whether the email belongs to another user
    const existingUser =
        await userRepository.findUserByEmail(
            email.toLowerCase().trim()
        );

    if (
        existingUser &&
        Number(existingUser.id) !== Number(userId)
    ) {
        const error = new Error(
            "Email is already registered by another user."
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
            "The selected college does not exist in CampVault."
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
                email: email.toLowerCase().trim(),
                number,
                location,
                college_id
            }
        );

    if (!updatedUser) {
        const error = new Error(
            "User not found."
        );

        error.statusCode = 404;
        throw error;
    }

    return updatedUser;
};