import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reporter is required'],
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event is required'],
        },
        category: {
            type: String,
            required: [true, 'Report category is required'],
            enum: [
                'scam/fraud',
                'inappropriate-content',
                'incorrect-information',
                'spam',
                'duplicate-event',
                'other',
            ],
        },
        description: {
            type: String,
            required: [true, 'Report description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'investigating', 'resolved', 'dismissed'],
            default: 'pending',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: {
            type: Date,
        },
        resolution: {
            action: {
                type: String,
                enum: [
                    'no-action',
                    'event-removed',
                    'event-edited',
                    'organizer-warned',
                    'organizer-suspended',
                    'organizer-banned',
                ],
            },
            notes: {
                type: String,
                maxlength: [1000, 'Resolution notes cannot exceed 1000 characters'],
            },
            notifyReporter: {
                type: Boolean,
                default: true,
            },
        },
        isResolved: {
            type: Boolean,
            default: false,
        },
        resolvedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reportSchema.index({ event: 1, reporter: 1 });
reportSchema.index({ status: 1, priority: -1 });
reportSchema.index({ event: 1, status: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ reviewedBy: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ isResolved: 1 });
reportSchema.index({ createdAt: -1 });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ priority: -1, status: 1 });

// Virtual for time since reported
reportSchema.virtual('timeSinceReported').get(function () {
    const now = new Date();
    const diff = now - this.createdAt;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
        return `${hours} hours ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
});

reportSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'resolved') {
        this.isResolved = true;
        this.resolvedAt = new Date();
    }
    next();
});

// Get report statistics for an event
reportSchema.statics.getEventReportCount = async function (eventId) {
    const count = await this.countDocuments({
        event: eventId,
        status: { $in: ['pending', 'investigating'] },
    });
    return count;
};

// Get report statistics for admin
reportSchema.statics.getUserReportStats = async function (userId) {
    const stats = await this.aggregate([
        {
            $match: {
                reporter: userId,
            },
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const result = {
        total: 0,
        pending: 0,
        investigating: 0,
        resolved: 0,
        dismissed: 0,
    };

    stats.forEach((stat) => {
        result[stat._id] = stat.count;
        result.total += stat.count;
    });

    return result;
};

// Calculate priority based on report count
reportSchema.statics.calculatePriority = function (reportCount) {
    if (reportCount >= 10) return 'critical';
    if (reportCount >= 5) return 'high';
    if (reportCount >= 2) return 'medium';
    return 'low';
};

// Check if reporter can be notified
reportSchema.methods.shouldNotifyReporter = function () {
    return (
        this.isResolved &&
        this.resolution &&
        this.resolution.notifyReporter === true
    );
};

const Report = mongoose.model('Report', reportSchema);

export default Report;