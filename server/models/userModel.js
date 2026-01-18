import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address',
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,
        },
        interests: {
            type: [String],
            required: [true, 'Please select at least 3 interests'],
            validate: {
                validator: function (arr) {
                    return arr.length >= 3 && arr.length <= 5;
                },
                message: 'Please select between 3 and 5 interests',
            },
            enum: [
                'Music & Concerts',
                'Arts & Culture',
                'Sports & Fitness',
                'Food & Drink',
                'Business & Networking',
                'Technology',
                'Health & Wellness',
                'Community & Charity',
                'Entertainment',
                'Education & Workshops',
                'Family & Kids',
                'Nightlife',
            ],
        },
        location: {
            city: {
                type: String,
                required: [true, 'City is required'],
                trim: true,
            },
            neighborhood: {
                type: String,
                trim: true,
            },
            coordinates: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point',
                },
                coordinates: {
                    type: [Number],
                    default: [0, 0],
                },
            },
        },
        role: {
            type: String,
            enum: ['user', 'organizer', 'admin'],
            default: 'user',
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        savedEvents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Event',
            },
        ],
        interestedEvents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Event',
            },
        ],
        followedOrganizers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        profilePicture: {
            type: String,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
        emailVerificationToken: {
            type: String,
            select: false,
        },
        emailVerificationExpires: {
            type: Date,
            select: false,
        },
        passwordResetToken: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },
        notificationPreferences: {
            emailReminders: {
                type: Boolean,
                default: true,
            },
            weeklyDigest: {
                type: Boolean,
                default: true,
            },
            newEventFromFollowed: {
                type: Boolean,
                default: true,
            },
            eventUpdates: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

userSchema.index({ role: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ interests: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Geospatial index for location-based queries
userSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for full name (for later use)
userSchema.virtual('fullName').get(function () {
    return this.name;
});

userSchema.pre('save', async function (next) {
    // Only hash password if it's modified or new
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

userSchema.methods.isOrganizer = function () {
    return this.role === 'organizer' || this.role === 'admin';
};

userSchema.methods.isAdmin = function () {
    return this.role === 'admin';
};

const User = mongoose.model('User', userSchema);

export default User;