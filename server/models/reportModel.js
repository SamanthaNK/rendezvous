import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
    {
        reportedBy: {
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
                'scam-fraud',
                'inappropriate-content',
                'incorrect-information',
                'spam',
                'duplicate-event',
                'other',
            ],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'investigating', 'resolved', 'dismissed'],
            default: 'pending',
        },
        resolution: {
            type: String,
            trim: true,
            maxlength: [500, 'Resolution cannot exceed 500 characters'],
        },
        resolvedAt: {
            type: Date,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
reportSchema.index({ event: 1, reportedBy: 1 }, { unique: true }); // One report per user per event
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;