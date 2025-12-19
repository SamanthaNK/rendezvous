import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Event description is required'],
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        categories: {
            type: [String],
            required: [true, 'At least one category is required'],
            validate: {
                validator: function (arr) {
                    return arr.length > 0;
                },
                message: 'At least one category must be selected',
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
        date: {
            type: Date,
            required: [true, 'Event date is required'],
            validate: {
                validator: function (value) {
                    return value > new Date();
                },
                message: 'Event date must be in the future',
            },
        },
        time: {
            type: String,
            required: [true, 'Event time is required'],
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time (HH:MM)'],
        },
        duration: {
            type: Number,
            min: [0, 'Duration cannot be negative'],
        },
        location: {
            venue: {
                type: String,
                required: [true, 'Venue name is required'],
                trim: true,
            },
            address: {
                type: String,
                required: [true, 'Address is required'],
                trim: true,
            },
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
                    required: true,
                },
                coordinates: {
                    type: [Number],
                    required: true,
                },
            },
        },
        eventType: {
            type: String,
            required: [true, 'Event type is required'],
            enum: ['online', 'in-person', 'hybrid'],
        },
        onlineEventLink: {
            type: String,
            validate: {
                validator: function (value) {
                    if (this.eventType === 'online' || this.eventType === 'hybrid') {
                        return value && value.trim().length > 0;
                    }
                    return true;
                },
                message: 'Online event link is required for online/hybrid events',
            },
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
            default: 0,
        },
        isFree: {
            type: Boolean,
            default: function () {
                return this.price === 0;
            },
        },
        capacity: {
            type: Number,
            min: [0, 'Capacity cannot be negative'],
        },
        contactInfo: {
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
        images: {
            type: [String],
            required: [true, 'At least one image is required'],
            validate: {
                validator: function (arr) {
                    return arr.length >= 1 && arr.length <= 5;
                },
                message: 'Please upload between 1 and 5 images',
            },
        },
        tags: {
            type: [String],
            validate: {
                validator: function (arr) {
                    return arr.length <= 5;
                },
                message: 'Maximum 5 tags allowed',
            },
        },
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Organizer is required'],
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'cancelled', 'past'],
            default: 'draft',
        },
        isDraft: {
            type: Boolean,
            default: true,
        },
        publishedAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
        cancellationReason: {
            type: String,
            maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
        },
        socialLinks: {
            facebook: String,
            instagram: String,
            tiktok: String,
            twitter: String,
            website: String,
        },
        sourceUrl: {
            type: String,
        },
        metrics: {
            views: {
                type: Number,
                default: 0,
            },
            saves: {
                type: Number,
                default: 0,
            },
            interested: {
                type: Number,
                default: 0,
            },
            clickThroughs: {
                type: Number,
                default: 0,
            },
        },
        interestedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        isFlagged: {
            type: Boolean,
            default: false,
        },
        flagReason: {
            type: String,
        },
        flagConfidenceScore: {
            type: Number,
            min: [0, 'Confidence score must be between 0 and 1'],
            max: [1, 'Confidence score must be between 0 and 1'],
        },
        aiSuggestedCategory: {
            type: String,
        },
        embedding: {
            type: [Number],
            select: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ 'location.coordinates': '2dsphere' });
eventSchema.index({ categories: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ price: 1 });
eventSchema.index({ isFree: 1 });
eventSchema.index({ isFlagged: 1 });
eventSchema.index({ isDraft: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ publishedAt: -1 });

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ categories: 1, date: 1 });
eventSchema.index({ 'location.city': 1, date: 1 });

// Virtual for average rating
eventSchema.virtual('averageRating', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'event',
    justOne: false,
    options: { match: { isDeleted: false } },
});

// Virtual for review count
eventSchema.virtual('reviewCount', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'event',
    count: true,
});

eventSchema.pre('save', function (next) {
    this.isFree = this.price === 0;

    // Update status to past if date has passed
    if (this.date < new Date() && this.status === 'published') {
        this.status = 'past';
    }

    next();
});

// Calculate average rating
eventSchema.statics.calculateAverageRating = async function (eventId) {
    const Review = mongoose.model('Review');
    const stats = await Review.aggregate([
        {
            $match: {
                event: eventId,
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: '$event',
                averageRating: { $avg: '$rating' },
                numReviews: { $sum: 1 },
            },
        },
    ]);

    return stats.length > 0 ? stats[0] : { averageRating: 0, numReviews: 0 };
};

const Event = mongoose.model('Event', eventSchema);

export default Event;