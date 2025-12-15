const { UserModel } = require('../models/userModel');

const profileController = {

    // ==================== GET PROFILE ====================
    // GET /api/profile
    async getProfile(req, res) {
        try {
            const user = req.user;

            res.json({
                success: true,
                message: 'Profile retrieved',
                data: {
                    uuid: user.uuid,
                    email: user.email,
                    phone: user.phone,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    profileImage: user.profile_image,
                    dateOfBirth: user.date_of_birth,
                    gender: user.gender,
                    address: user.address,
                    city: user.city,
                    country: user.country,
                    isEmailVerified: user.is_email_verified,
                    isPhoneVerified: user.is_phone_verified,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at
                }
            });

        } catch (error) {
            console.log('Get profile error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get profile',
                error: error.message
            });
        }
    },


    // ==================== UPDATE PROFILE ====================
    // PUT /api/profile
    async updateProfile(req, res) {
        try {
            const user = req.user;
            const {
                firstName,
                lastName,
                profileImage,
                dateOfBirth,
                gender,
                address,
                city,
                country
            } = req.body;

            // Build update object (only include provided fields)
            const updateData = {};
            if (firstName !== undefined) updateData.firstName = firstName;
            if (lastName !== undefined) updateData.lastName = lastName;
            if (profileImage !== undefined) updateData.profileImage = profileImage;
            if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
            if (gender !== undefined) updateData.gender = gender;
            if (address !== undefined) updateData.address = address;
            if (city !== undefined) updateData.city = city;
            if (country !== undefined) updateData.country = country;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            // Update user
            await UserModel.update(user.uuid, updateData);

            // Get updated user
            const updatedUser = await UserModel.findByUuid(user.uuid);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    uuid: updatedUser.uuid,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    firstName: updatedUser.first_name,
                    lastName: updatedUser.last_name,
                    profileImage: updatedUser.profile_image,
                    dateOfBirth: updatedUser.date_of_birth,
                    gender: updatedUser.gender,
                    address: updatedUser.address,
                    city: updatedUser.city,
                    country: updatedUser.country,
                    updatedAt: updatedUser.updated_at
                }
            });

        } catch (error) {
            console.log('Update profile error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    },


    // ==================== UPDATE EMAIL ====================
    // PUT /api/profile/email
    async updateEmail(req, res) {
        try {
            const user = req.user;
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Check if email already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser && existingUser.uuid !== user.uuid) {
                return res.status(409).json({
                    success: false,
                    message: 'Email is already in use'
                });
            }

            // Update email
            await UserModel.update(user.uuid, { 
                email: email, 
                isEmailVerified: false 
            });

            res.json({
                success: true,
                message: 'Email updated. Please verify your new email.',
                data: { email: email }
            });

        } catch (error) {
            console.log('Update email error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to update email',
                error: error.message
            });
        }
    },


    // ==================== UPDATE PHONE ====================
    // PUT /api/profile/phone
    async updatePhone(req, res) {
        try {
            const user = req.user;
            const { phone } = req.body;

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is required'
                });
            }

            // Check if phone already exists
            const existingUser = await UserModel.findByPhone(phone);
            if (existingUser && existingUser.uuid !== user.uuid) {
                return res.status(409).json({
                    success: false,
                    message: 'Phone number is already in use'
                });
            }

            // Update phone
            await UserModel.update(user.uuid, { 
                phone: phone, 
                isPhoneVerified: false 
            });

            res.json({
                success: true,
                message: 'Phone updated. Please verify your new phone number.',
                data: { phone: phone }
            });

        } catch (error) {
            console.log('Update phone error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to update phone',
                error: error.message
            });
        }
    },


    // ==================== DELETE ACCOUNT ====================
    // DELETE /api/profile
    async deleteAccount(req, res) {
        try {
            const user = req.user;
            const { confirmDelete } = req.body;

            if (confirmDelete !== true) {
                return res.status(400).json({
                    success: false,
                    message: 'Please confirm deletion by setting confirmDelete: true'
                });
            }

            // Soft delete user
            await UserModel.delete(user.uuid);

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });

        } catch (error) {
            console.log('Delete account error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to delete account',
                error: error.message
            });
        }
    },


    // ==================== GET SETTINGS ====================
    // GET /api/profile/settings
    async getSettings(req, res) {
        try {
            const user = req.user;

            res.json({
                success: true,
                message: 'Settings retrieved',
                data: {
                    notifications: {
                        email: true,
                        push: true,
                        sms: true,
                        promotions: false
                    },
                    privacy: {
                        showProfile: true,
                        showBookings: false
                    },
                    preferences: {
                        language: 'en',
                        currency: 'USD',
                        timezone: 'UTC'
                    },
                    account: {
                        email: user.email,
                        phone: user.phone,
                        isEmailVerified: user.is_email_verified,
                        isPhoneVerified: user.is_phone_verified
                    }
                }
            });

        } catch (error) {
            console.log('Get settings error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get settings',
                error: error.message
            });
        }
    },


    // ==================== UPDATE SETTINGS ====================
    // PUT /api/profile/settings
    async updateSettings(req, res) {
        try {
            const { notifications, privacy, preferences } = req.body;

            // In a real app, save these to a user_settings table
            // For now, just return success

            res.json({
                success: true,
                message: 'Settings updated successfully',
                data: {
                    notifications: notifications || {},
                    privacy: privacy || {},
                    preferences: preferences || {}
                }
            });

        } catch (error) {
            console.log('Update settings error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to update settings',
                error: error.message

                
            });
        }
    }
};

module.exports = profileController;


module.exports=profileController;module.exports=profileController; module.exports=profileController;



