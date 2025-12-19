import bcrypt from 'bcrypt';
import { generateToken, verifyToken } from '../utils/jwt.js';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role = 'user' } = req.body;

        // Validation (ideally should be done with express-validator middleware)
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, password, firstName, lastName'
            });
        }

        // TODO: Check if user already exists in database
        // const existingUser = await User.findOne({ email });
        // if (existingUser) {
        //     return res.status(409).json({
        //         success: false,
        //         message: 'Email already registered'
        //     });
        // }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // TODO: Create new user in database
        // const newUser = new User({
        //     email,
        //     password: hashedPassword,
        //     firstName,
        //     lastName,
        //     role
        // });
        // await newUser.save();

        // Generate tokens
        const user = { email, firstName, lastName, role };
        const accessToken = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                accessToken
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Login user with email and password
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // TODO: Find user in database
        // const user = await User.findOne({ email });
        // if (!user) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Invalid email or password'
        //     });
        // }

        // TODO: Compare passwords
        // const isPasswordValid = await bcrypt.compare(password, user.password);
        // if (!isPasswordValid) {
        //     return res.status(401).json({
        //         success: false,
        //         message: 'Invalid email or password'
        //     });
        // }

        // Generate tokens
        const user = { email }; // TODO: Replace with actual user data
        const accessToken = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                accessToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 */
export const refreshToken = (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = verifyToken(token);

        // Generate new access token
        const newAccessToken = generateToken({
            email: decoded.email,
            role: decoded.role
        });

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Token refresh failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Logout user (can be used for token blacklisting in future)
 * @route POST /api/auth/logout
 */
export const logout = (req, res) => {
    try {
        // TODO: Implement token blacklisting if needed
        // For now, logout is handled client-side by removing the token

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};