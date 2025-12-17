const { auth } = require('../config/firebase');
const { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    // sendPasswordResetEmail, // no longer using Firebase reset email
    signOut
} = require('firebase/auth');
const { UserModel } = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { generateOtp, getExpiryTime } = require('../utils/otp');   // OTP helper
const { sendEmail } = require('../config/mailer');                // Nodemailer helper

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { uuid: user.uuid, email: user.email, phone: user.phone },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
};

const authController = {

    // ==================== REGISTER WITH EMAIL ====================
    // POST /api/auth/register/email
    async registerWithEmail(req, res) {
        try {
            const { email, password, firstName, lastName, phone } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Check if user already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Send default Firebase email verification (optional)
            await sendEmailVerification(firebaseUser);

            // Create user in database
            const { uuid } = await UserModel.create({
                firebaseUid: firebaseUser.uid,
                email: email,
                phone: phone,
                firstName: firstName,
                lastName: lastName
            });

            // Get user from database
            const user = await UserModel.findByUuid(uuid);

            // Generate OTP for email
            const otp = generateOtp();
            const expiresAt = getExpiryTime();

            // Save OTP in DB
            await UserModel.update(user.uuid, {
                email_otp: otp,
                email_otp_expires_at: expiresAt
            });

            // Send OTP email
            await sendEmail({
                to: user.email,
                subject: 'Your registration OTP',
                text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
            });

            // Generate JWT
            const token = generateToken(user);

            res.status(201).json({
                success: true,
                message: 'OTP sent to your email. Please enter it to complete registration.',
                data: {
                    user: {
                        uuid: user.uuid,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        phone: user.phone,
                        isEmailVerified: false
                    },
                    token: token
                }
            });

        } catch (error) {
            console.log('Register error:', error.message);
            
            // Handle Firebase errors
            let message = 'Registration failed';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Email is already registered';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address';
            }

            res.status(400).json({
                success: false,
                message: message,
                error: error.message
            });
        }
    },

    // ==================== LOGIN WITH EMAIL ====================
    // POST /api/auth/login/email
    async loginWithEmail(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Find user in database
            let user = await UserModel.findByFirebaseUid(firebaseUser.uid);

            // If user not in database, create
            if (!user) {
                const { uuid } = await UserModel.create({
                    firebaseUid: firebaseUser.uid,
                    email: firebaseUser.email
                });
                user = await UserModel.findByUuid(uuid);
            }

            // Update last login
            await UserModel.updateLastLogin(user.uuid);

            // Update email verified status
            if (firebaseUser.emailVerified && !user.is_email_verified) {
                await UserModel.update(user.uuid, { isEmailVerified: true });
            }

            // Generate JWT
            const token = generateToken(user);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        uuid: user.uuid,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        phone: user.phone,
                        profileImage: user.profile_image,
                        isEmailVerified: firebaseUser.emailVerified
                    },
                    token: token
                }
            });

        } catch (error) {
            console.log('Login error:', error.message);

            let message = 'Login failed';
            if (error.code === 'auth/user-not-found') {
                message = 'User not found';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Invalid password';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many failed attempts. Please try again later.';
            }

            res.status(401).json({
                success: false,
                message: message,
                error: error.message
            });
        }
    },

    // ==================== SEND OTP TO PHONE ====================
    // POST /api/auth/send-otp
    async sendOtp(req, res) {
        try {
            const { phone } = req.body;

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is required'
                });
            }

            res.json({
                success: true,
                message: 'OTP should be sent from frontend using Firebase SDK',
                data: {
                    phone: phone,
                    note: 'Use Firebase signInWithPhoneNumber on frontend',
                    steps: [
                        '1. Initialize Firebase on frontend',
                        '2. Set up reCAPTCHA verifier',
                        '3. Call signInWithPhoneNumber(auth, phoneNumber, appVerifier)',
                        '4. User receives OTP via SMS',
                        '5. Verify OTP using confirmationResult.confirm(code)',
                        '6. Send Firebase ID token to /api/auth/verify-otp'
                    ]
                }
            });

        } catch (error) {
            console.log('Send OTP error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP',
                error: error.message
            });
        }
    },

    // ==================== VERIFY OTP / PHONE LOGIN ====================
    // POST /api/auth/verify-otp
    async verifyOtp(req, res) {
        try {
            const { firebaseIdToken, phone } = req.body;

            if (!firebaseIdToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Firebase ID token is required'
                });
            }

            // Find or create user
            let user = await UserModel.findByPhone(phone);

            if (!user) {
                const { uuid } = await UserModel.create({
                    firebaseUid: firebaseIdToken.substring(0, 128), // placeholder
                    phone: phone
                });
                user = await UserModel.findByUuid(uuid);
            }

            // Update phone verified
            await UserModel.update(user.uuid, { isPhoneVerified: true });

            // Update last login
            await UserModel.updateLastLogin(user.uuid);

            // Generate JWT
            const token = generateToken(user);

            res.json({
                success: true,
                message: 'Phone verification successful',
                data: {
                    user: {
                        uuid: user.uuid,
                        email: user.email,
                        phone: user.phone,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        isPhoneVerified: true,
                        isNewUser: !user.first_name
                    },
                    token: token
                }
            });

        } catch (error) {
            console.log('Verify OTP error:', error.message);
            res.status(401).json({
                success: false,
                message: 'OTP verification failed',
                error: error.message
            });
        }
    },

    // ==================== FORGOT PASSWORD (SEND OTP VIA NODEMAILER) ====================
    // POST /api/auth/forgot-password
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Check user in DB
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'No user found with this email'
                });
            }

            // Generate OTP and expiry
            const otp = generateOtp();
            const expiresAt = getExpiryTime();

            // Save OTP to DB
            await UserModel.update(user.uuid, {
                password_reset_otp: otp,
                password_reset_otp_expires_at: expiresAt
            });

            // Send OTP email via Nodemailer
            await sendEmail({
                to: email,
                subject: 'Your password reset OTP',
                text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
            });

            res.json({
                success: true,
                message: 'Password reset OTP sent to your email.'
            });

        } catch (error) {
            console.log('Forgot password error:', error.message);

            res.status(500).json({
                success: false,
                message: 'Failed to send password reset OTP',
                error: error.message
            });
        }
    },

    // ==================== RESET PASSWORD (VERIFY OTP) ====================
    // POST /api/auth/reset-password
    async resetPassword(req, res) {
        try {
            const { email, otp, newPassword } = req.body;

            if (!email || !otp || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, OTP and newPassword are required'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.password_reset_otp || !user.password_reset_otp_expires_at) {
                return res.status(400).json({
                    success: false,
                    message: 'No OTP requested or OTP expired'
                });
            }

            const now = new Date();
            const expiresAt = new Date(user.password_reset_otp_expires_at);

            if (now > expiresAt) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP expired'
                });
            }

            if (user.password_reset_otp !== otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP'
                });
            }

            // Here you SHOULD change password in Firebase Auth on frontend
            // using Firebase JS SDK (confirmPasswordReset / updatePassword). [web:223][web:220]

            // Clear OTP fields
            await UserModel.update(user.uuid, {
                password_reset_otp: null,
                password_reset_otp_expires_at: null
            });

            res.json({
                success: true,
                message: 'Password reset OTP verified. Now update password in Firebase/front-end.'
            });

        } catch (error) {
            console.log('Reset password error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password',
                error: error.message
            });
        }
    },

    // ==================== SEND EMAIL OTP ====================
    // POST /api/auth/send-email-otp
    async sendEmailOtp(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const otp = generateOtp();
            const expiresAt = getExpiryTime();

            await UserModel.update(user.uuid, {
                email_otp: otp,
                email_otp_expires_at: expiresAt
            });

            await sendEmail({
                to: email,
                subject: 'Your verification code',
                text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
            });

            res.json({
                success: true,
                message: 'Email OTP sent successfully'
            });

        } catch (error) {
            console.log('Send email OTP error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to send email OTP',
                error: error.message
            });
        }
    },

    // ==================== VERIFY EMAIL OTP ====================
    // POST /api/auth/verify-email-otp
    async verifyEmailOtp(req, res) {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
            }

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.email_otp || !user.email_otp_expires_at) {
                return res.status(400).json({
                    success: false,
                    message: 'No OTP requested or OTP expired'
                });
            }

            const now = new Date();
            const expiresAt = new Date(user.email_otp_expires_at);

            if (now > expiresAt) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP expired'
                });
            }

            if (user.email_otp !== otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP'
                });
            }

            await UserModel.update(user.uuid, {
                is_email_verified: 1,
                email_otp: null,
                email_otp_expires_at: null
            });

            res.json({
                success: true,
                message: 'Registration successful. Email verified.'
            });

        } catch (error) {
            console.log('Verify email OTP error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to verify email OTP',
                error: error.message
            });
        }
    },

    // ==================== RESEND VERIFICATION EMAIL ====================
    // POST /api/auth/resend-verification
    async resendVerification(req, res) {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'No user logged in'
                });
            }

            await sendEmailVerification(currentUser);

            res.json({
                success: true,
                message: 'Verification email sent'
            });

        } catch (error) {
            console.log('Resend verification error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to send verification email',
                error: error.message
            });
        }
    },

    // ==================== LOGOUT ====================
    // POST /api/auth/logout
    async logout(req, res) {
        try {
            await signOut(auth);

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.log('Logout error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Logout failed',
                error: error.message
            });
        }
    },

    // ==================== GET CURRENT USER ====================
    // GET /api/auth/me
    async getCurrentUser(req, res) {
        try {
            const user = req.user;

            res.json({
                success: true,
                message: 'User retrieved',
                data: {
                    uuid: user.uuid,
                    email: user.email,
                    phone: user.phone,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    profileImage: user.profile_image,
                    dateOfBirth: user.date_of_birth,
                    gender: user.gender,
                    isEmailVerified: user.is_email_verified,
                    isPhoneVerified: user.is_phone_verified,
                    createdAt: user.created_at
                }
            });

        } catch (error) {
            console.log('Get current user error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get user',
                error: error.message
            });
        }
    }
};

module.exports = authController;
