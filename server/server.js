import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database.js';
import { generateToken } from './utils/jwt.js';
import { authenticateToken } from './middleware/auth.js';
import { requireAdmin, requireOrganizer, requireUser } from './middleware/roleCheck.js';
import authRoutes from './routes/auth.js';

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Rendezvous API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Dummy routes for testing authentication middleware
app.get('/api/test/generate-token', (req, res) => {
    // Generate test tokens for different roles
    const testUsers = {
        user: { id: '123', email: 'user@example.com', role: 'user' },
        organizer: { id: '456', email: 'organizer@example.com', role: 'organizer' },
        admin: { id: '789', email: 'admin@example.com', role: 'admin' }
    };

    const tokens = {};
    for (const [role, user] of Object.entries(testUsers)) {
        tokens[role] = generateToken(user);
    }

    res.json({
        success: true,
        message: 'Test tokens generated',
        tokens
    });
});

app.get('/api/test/protected', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Protected route accessed successfully',
        user: req.user
    });
});

app.get('/api/test/user-only', authenticateToken, requireUser, (req, res) => {
    res.json({
        success: true,
        message: 'User-only route accessed',
        user: req.user
    });
});

app.get('/api/test/organizer-only', authenticateToken, requireOrganizer, (req, res) => {
    res.json({
        success: true,
        message: 'Organizer-only route accessed',
        user: req.user
    });
});

app.get('/api/test/admin-only', authenticateToken, requireAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Admin-only route accessed',
        user: req.user
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});