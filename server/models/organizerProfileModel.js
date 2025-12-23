import mongoose from 'mongoose';

const organizerProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
            unique: true,
        },
        organizationName: {
            type: String,
            trim: true,
            maxlength: [200, 'Organization name cannot exceed 200 characters'],
        },
        bio: {
            type: String,
            trim: true,
            maxlength: [1000, 'Bio cannot exceed 1000 characters'],
        },
        website: {
            type: String,
            trim: true,
        },
        socialLinks: {
            facebook: String,
            instagram: String,
            tiktok: String,
            twitter: String,
            linkedin: String,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedAt: {
            type: Date,
        },
        verificationBadge: {
            type: String,
            enum: ['none', 'verified', 'premium'],
            default: 'none',
        },
        metrics: {
            totalEvents: {
                type: Number,
                default: 0,
            },
            upcomingEvents: {
                type: Number,
                default: 0,
            },
            pastEvents: {
                type: Number,
                default: 0,
            },
            totalViews: {
                type: Number,
                default: 0,
            },
            totalSaves: {
                type: Number,
                default: 0,
            },
            totalInterested: {
                type: Number,
                default: 0,
            },
            followerCount: {
                type: Number,
                default: 0,
            },
            averageRating: {
                type: Number,
                default: 0,
                min: 0,
                max: 5,
            },
            totalReviews: {
                type: Number,
                default: 0,
            },
        },
        contactInfo: {
            businessPhone: String,
            businessEmail: String,
            physicalAddress: String,
        },
        businessInfo: {
            registrationNumber: String,
            businessType: {
                type: String,
                enum: [
                    'individual',
                    'company',
                    'non-profit',
                    'government',
                    'educational',
                    'other',
                ],
            },
            establishedYear: Number,
        },
        accountStatus: {
            type: String,
            enum: ['active', 'suspended', 'banned'],
            default: 'active',
        },
        suspensionInfo: {
            reason: String,
            suspendedAt: Date,
            suspendedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            suspensionEndDate: Date,
            isSuspended: {
                type: Boolean,
                default: false,
            },
        },
        banInfo: {
            reason: String,
            bannedAt: Date,
            bannedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            isPermanent: {
                type: Boolean,
                default: false,
            },
        },
        warningCount: {
            type: Number,
            default: 0,
        },
        lastWarningDate: {
            type: Date,
        },
        performanceMetrics: {
            responseTime: {
                type: Number,
                default: 0,
            },
            eventCancellationRate: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
            flaggedEventCount: {
                type: Number,
                default: 0,
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

organizerProfileSchema.index({ user: 1 });
organizerProfileSchema.index({ isVerified: 1 });
organizerProfileSchema.index({ 'metrics.averageRating': -1 });
organizerProfileSchema.index({ 'metrics.followerCount': -1 });
organizerProfileSchema.index({ accountStatus: 1 });
organizerProfileSchema.index({ verificationBadge: 1 });
organizerProfileSchema.index({ createdAt: -1 });

organizerProfileSchema.index({ isVerified: 1, 'metrics.averageRating': -1 });
organizerProfileSchema.index({
    accountStatus: 1,
    'metrics.totalEvents': -1,
});

// Virtual for active suspension status
organizerProfileSchema.virtual('isCurrentlySuspended').get(function () {
    if (!this.suspensionInfo || !this.suspensionInfo.isSuspended) {
        return false;
    }
    if (!this.suspensionInfo.suspensionEndDate) {
        return true;
    }
    return new Date() < this.suspensionInfo.suspensionEndDate;
});

// Virtual for verification status display
organizerProfileSchema.virtual('verificationStatus').get(function () {
    if (this.isVerified) {
        return 'verified';
    }
    return 'unverified';
});

organizerProfileSchema.pre('save', function (next) {
    // Update account status based on suspension
    if (this.suspensionInfo && this.suspensionInfo.isSuspended) {
        if (this.suspensionInfo.suspensionEndDate) {
            if (new Date() > this.suspensionInfo.suspensionEndDate) {
                this.suspensionInfo.isSuspended = false;
                this.accountStatus = 'active';
            } else {
                this.accountStatus = 'suspended';
            }
        } else {
            this.accountStatus = 'suspended';
        }
    }

    // Update account status based on ban
    if (this.banInfo && this.banInfo.bannedAt) {
        this.accountStatus = 'banned';
    }

    next();
});

// Update organizer metrics
organizerProfileSchema.statics.updateMetrics = async function (userId) {
    const Event = mongoose.model('Event');
    const Review = mongoose.model('Review');

    const events = await Event.find({
        organizer: userId,
        isDraft: false,
    }).lean();

    const totalEvents = events.length;
    const upcomingEvents = events.filter(
        (e) => e.status === 'published' && new Date(e.date) > new Date()
    ).length;
    const pastEvents = events.filter((e) => e.status === 'past').length;

    const totalViews = events.reduce((sum, e) => sum + (e.metrics?.views || 0), 0);
    const totalSaves = events.reduce((sum, e) => sum + (e.metrics?.saves || 0), 0);
    const totalInterested = events.reduce(
        (sum, e) => sum + (e.metrics?.interested || 0),
        0
    );

    const eventIds = events.map((e) => e._id);
    const reviews = await Review.find({
        event: { $in: eventIds },
        isDeleted: false,
    }).lean();

    const totalReviews = reviews.length;
    const averageRating =
        totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

    await this.findOneAndUpdate(
        { user: userId },
        {
            $set: {
                'metrics.totalEvents': totalEvents,
                'metrics.upcomingEvents': upcomingEvents,
                'metrics.pastEvents': pastEvents,
                'metrics.totalViews': totalViews,
                'metrics.totalSaves': totalSaves,
                'metrics.totalInterested': totalInterested,
                'metrics.totalReviews': totalReviews,
                'metrics.averageRating': Math.round(averageRating * 10) / 10,
            },
        }
    );
};

// Check if organizer can create events
organizerProfileSchema.methods.canCreateEvents = function () {
    if (this.accountStatus !== 'active') return false;
    if (this.suspensionInfo?.isSuspended) {
        if (this.suspensionInfo.suspensionEndDate) {
            return new Date() > this.suspensionInfo.suspensionEndDate;
        }
        return false;
    }
    return true;
};

// Suspend organizer
organizerProfileSchema.methods.suspend = function (
    reason,
    suspendedBy,
    durationDays = null
) {
    this.suspensionInfo = {
        reason,
        suspendedAt: new Date(),
        suspendedBy,
        suspensionEndDate: durationDays
            ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
            : null,
        isSuspended: true,
    };
    this.accountStatus = 'suspended';
};

// Ban organizer
organizerProfileSchema.methods.ban = function (
    reason,
    bannedBy,
    isPermanent = true
) {
    this.banInfo = {
        reason,
        bannedAt: new Date(),
        bannedBy,
        isPermanent,
    };
    this.accountStatus = 'banned';
};

const OrganizerProfile = mongoose.model(
    'OrganizerProfile',
    organizerProfileSchema
);

export default OrganizerProfile;