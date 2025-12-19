import mongoose from 'mongoose';

const verificationRequestSchema = new mongoose.Schema(
    {
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Organizer is required'],
            unique: true,
        },
        organizationName: {
            type: String,
            required: [true, 'Organization name is required'],
            trim: true,
            maxlength: [200, 'Organization name cannot exceed 200 characters'],
        },
        registrationNumber: {
            type: String,
            trim: true,
        },
        contactPerson: {
            fullName: {
                type: String,
                required: [true, 'Contact person name is required'],
                trim: true,
            },
            position: {
                type: String,
                trim: true,
            },
            phone: {
                type: String,
                required: [true, 'Contact phone is required'],
                trim: true,
            },
            email: {
                type: String,
                required: [true, 'Contact email is required'],
                trim: true,
                match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
            },
        },
        physicalAddress: {
            type: String,
            required: [true, 'Physical address is required'],
            trim: true,
        },
        documents: {
            businessLicense: {
                url: String,
                uploadedAt: Date,
            },
            governmentId: {
                url: String,
                uploadedAt: Date,
            },
            additionalDocuments: [
                {
                    name: String,
                    url: String,
                    uploadedAt: Date,
                },
            ],
        },
        socialMediaLinks: {
            facebook: String,
            instagram: String,
            tiktok: String,
            twitter: String,
            website: String,
        },
        previousEvents: {
            type: String,
            trim: true,
            maxlength: [1000, 'Previous events description cannot exceed 1000 characters'],
        },
        additionalInfo: {
            type: String,
            trim: true,
            maxlength: [2000, 'Additional information cannot exceed 2000 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'under-review', 'approved', 'rejected'],
            default: 'pending',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: {
            type: Date,
        },
        reviewNotes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Review notes cannot exceed 1000 characters'],
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
        },
        improvementSuggestions: {
            type: String,
            trim: true,
            maxlength: [1000, 'Improvement suggestions cannot exceed 1000 characters'],
        },
        reapplicationCount: {
            type: Number,
            default: 0,
        },
        lastReappliedAt: {
            type: Date,
        },
        isReapplication: {
            type: Boolean,
            default: false,
        },
        previousRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VerificationRequest',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

verificationRequestSchema.index({ organizer: 1 });
verificationRequestSchema.index({ status: 1, createdAt: -1 });
verificationRequestSchema.index({ reviewedBy: 1 });
verificationRequestSchema.index({ status: 1 });
verificationRequestSchema.index({ createdAt: -1 });

verificationRequestSchema.index({ status: 1, reviewedAt: -1 });

verificationRequestSchema.virtual('daysSinceSubmission').get(function () {
    const now = new Date();
    const diff = now - this.createdAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
});

verificationRequestSchema.virtual('hasRequiredDocuments').get(function () {
    return (
        this.documents?.businessLicense?.url || this.documents?.governmentId?.url
    );
});

// Track reapplication
verificationRequestSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        if (this.status === 'approved' || this.status === 'rejected') {
            this.reviewedAt = new Date();
        }
    }
    next();
});

// Get pending verification count
verificationRequestSchema.statics.getPendingCount = async function () {
    return await this.countDocuments({ status: 'pending' });
};

// Get verification statistics
verificationRequestSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
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
        'under-review': 0,
        approved: 0,
        rejected: 0,
    };

    stats.forEach((stat) => {
        result[stat._id] = stat.count;
        result.total += stat.count;
    });

    // Calculate average review time for approved requests
    const reviewTimes = await this.aggregate([
        {
            $match: {
                status: 'approved',
                reviewedAt: { $exists: true },
            },
        },
        {
            $project: {
                reviewTime: {
                    $subtract: ['$reviewedAt', '$createdAt'],
                },
            },
        },
        {
            $group: {
                _id: null,
                avgReviewTime: { $avg: '$reviewTime' },
            },
        },
    ]);

    result.avgReviewTimeDays =
        reviewTimes.length > 0
            ? Math.round(reviewTimes[0].avgReviewTime / (1000 * 60 * 60 * 24))
            : 0;

    return result;
};

// Approve verification
verificationRequestSchema.methods.approve = async function (
    reviewedBy,
    reviewNotes = ''
) {
    this.status = 'approved';
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    this.reviewNotes = reviewNotes;

    await this.save();

    // Update organizer profile
    const OrganizerProfile = mongoose.model('OrganizerProfile');
    await OrganizerProfile.findOneAndUpdate(
        { user: this.organizer },
        {
            $set: {
                isVerified: true,
                verifiedAt: new Date(),
                verificationBadge: 'verified',
            },
        },
        { upsert: true }
    );
};

// Reject verification
verificationRequestSchema.methods.reject = async function (
    reviewedBy,
    rejectionReason,
    improvementSuggestions = ''
) {
    this.status = 'rejected';
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    this.rejectionReason = rejectionReason;
    this.improvementSuggestions = improvementSuggestions;

    await this.save();
};

// Check if organizer can reapply
verificationRequestSchema.methods.canReapply = function () {
    if (this.status !== 'rejected') {
        return false;
    }

    // Allow reapplication after 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.reviewedAt && this.reviewedAt < thirtyDaysAgo;
};

const VerificationRequest = mongoose.model(
    'VerificationRequest',
    verificationRequestSchema
);

export default VerificationRequest;