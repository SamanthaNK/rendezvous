import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    text: {
      type: String,
      trim: true,
      maxlength: [500, 'Review text cannot exceed 500 characters'],
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    notHelpfulVotes: {
      type: Number,
      default: 0,
    },
    votedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        vote: {
          type: String,
          enum: ['helpful', 'not-helpful'],
        },
      },
    ],
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    editHistory: [
      {
        text: String,
        rating: Number,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One review per user per event
reviewSchema.index({ user: 1, event: 1 }, { unique: true });

reviewSchema.index({ event: 1, rating: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ helpfulVotes: -1 });
reviewSchema.index({ isFlagged: 1 });
reviewSchema.index({ isDeleted: 1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for helpful score
reviewSchema.virtual('helpfulScore').get(function () {
  const total = this.helpfulVotes + this.notHelpfulVotes;
  if (total === 0) return 0;
  return (this.helpfulVotes / total) * 100;
});

reviewSchema.pre('save', function (next) {
  if (this.isModified('text') || this.isModified('rating')) {
    // Don't add to history on first save
    if (!this.isNew) {
      this.editHistory.push({
        text: this.text,
        rating: this.rating,
        editedAt: new Date(),
      });
    }
  }
  next();
});

// Get review statistics for an event
reviewSchema.statics.getEventStats = async function (eventId) {
  const stats = await this.aggregate([
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
        totalReviews: { $sum: 1 },
        ratings: {
          $push: '$rating',
        },
      },
    },
    {
      $addFields: {
        ratingDistribution: {
          5: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 5] },
              },
            },
          },
          4: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 4] },
              },
            },
          },
          3: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 3] },
              },
            },
          },
          2: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 2] },
              },
            },
          },
          1: {
            $size: {
              $filter: {
                input: '$ratings',
                cond: { $eq: ['$$this', 1] },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        ratings: 0,
      },
    },
  ]);

  return stats.length > 0 ? stats[0] : null;
};

// Check if user can edit review
reviewSchema.methods.canEdit = function () {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.createdAt > sevenDaysAgo;
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;