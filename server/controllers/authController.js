import User from '../models/userModel.js';
import {
    generateAccessToken,
    generateVerificationToken,
    generatePasswordResetToken,
    hashToken,
    createTokenResponse,
} from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

// Register a new user
export const register = async (req, res) => {
    try {
        const { name, email, password, interests, location } = req.body;

        if (!name || !email || !password || !interests || !location) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered',
            });
        }

        if (!Array.isArray(interests) || interests.length < 3 || interests.length > 5) {
            return res.status(400).json({
                success: false,
                message: 'Please select between 3 and 5 interests',
            });
        }

        if (!location.city) {
            return res.status(400).json({
                success: false,
                message: 'City is required',
            });
        }

        const verificationToken = generateVerificationToken();
        const hashedToken = hashToken(verificationToken);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            interests,
            location,
            emailVerificationToken: hashedToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        try {
            await sendVerificationEmail(user.email, user.name, verificationToken);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue registration even if email fails
        }

        const token = generateAccessToken(user._id);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    interests: user.interests,
                    location: user.location,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                },
                token,
            },
            message: 'Registration successful. Please check your email to verify your account.',
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message,
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.',
            });
        }

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Generate token (with extended expiry if rememberMe)
        const token = generateAccessToken(user._id);

        res.json(createTokenResponse(user, token));
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
        });
    }
};

// Logout user
export const logout = async (req, res) => {
    // Logout will be handled on the client side by deleting the token
    try {
        res.json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message,
        });
    }
};

// Verify email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required',
            });
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() },
        }).select('+emailVerificationToken');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token',
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: 'Email verified successfully',
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed',
            error: error.message,
        });
    }
};

// Forgot password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }

        const { token, expires } = generatePasswordResetToken();
        const hashedToken = hashToken(token);

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = expires;
        await user.save({ validateBeforeSave: false });

        try {
            await sendPasswordResetEmail(user.email, user.name, token);
        } catch (emailError) {
            console.error('Password reset email failed:', emailError);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again.',
            });
        }

        res.json({
            success: true,
            message: 'Password reset link sent to your email',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request',
            error: error.message,
        });
    }
};

// Reset password
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required',
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long',
            });
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        }).select('+passwordResetToken');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token',
            });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message,
        });
    }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('followedOrganizers', 'name organizationName isVerified')
            .select('-password');

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data',
            error: error.message,
        });
    }
};