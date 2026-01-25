import Review from '../models/reviewModel.js';
import Event from '../models/eventModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';

// Create a new review for an event
export const createReview = async (req, res) => {
  try {
    const { eventId, rating, text } = req.body;
    const userId = req.user._id;

    if (!eventId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const event = await Event.findById(eventId)
      .select('_id date organizer')
      .lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if event has already occurred
    const eventDate = new Date(event.date);
    const now = new Date();

    if (eventDate > now) {
      return res.status(400).json({
        success: false,
        message: 'You can only review events that have already occurred',
      });
    }

    // Check if review window is still open (30 days after event)
    const thirtyDaysAfterEvent = new Date(eventDate);
    thirtyDaysAfterEvent.setDate(thirtyDaysAfterEvent.getDate() + 30);

    if (now > thirtyDaysAfterEvent) {
      return res.status(400).json({
        success: false,
        message: 'Review window has closed for this event',
      });
    }

    // Check if user already reviewed this event
    const existingReview = await Review.findOne({
      event: eventId,
      user: userId,
      isDeleted: false,
    }).lean();

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this event',
      });
    }

    const review = await Review.create({
      event: eventId,
      user: userId,
      rating,
      text: text?.trim() || '',
    });

    // Update event and organizer ratings
    await Promise.all([
      updateEventRating(eventId),
      updateOrganizerRating(event.organizer),
    ]);

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: { review: populatedReview },
      message: 'Review submitted successfully',
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message,
    });
  }
};

// Get all reviews for an event
export const getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // Check if event exists
    const event = await Event.findById(eventId).select('_id').lean();
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({
      event: eventId,
      isDeleted: false,
    })
      .populate('user', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Review.countDocuments({
      event: eventId,
      isDeleted: false,
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total,
        },
      },
    });
  } catch (error) {
    console.error('Get event reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, text } = req.body;
    const userId = req.user._id;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const review = await Review.findById(id).select('+editHistory');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Review has been deleted',
      });
    }

    // Check ownership
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews',
      });
    }

    // Check if edit window is still open (7 days)
    if (!review.canEdit()) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be edited within 7 days of posting',
      });
    }

    if (rating !== undefined) review.rating = rating;
    if (text !== undefined) review.text = text.trim();

    await review.save();

    // Update ratings if rating changed
    if (rating !== undefined) {
      const event = await Event.findById(review.event)
        .select('organizer')
        .lean();

      if (event) {
        await Promise.all([
          updateEventRating(review.event),
          updateOrganizerRating(event.organizer),
        ]);
      }
    }

    const updatedReview = await Review.findById(review._id)
      .populate('user', 'name email')
      .lean();

    res.json({
      success: true,
      data: { review: updatedReview },
      message: 'Review updated successfully',
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

// Delete a review (soft delete)
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Review has already been deleted',
      });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews',
      });
    }

    review.isDeleted = true;
    review.deletedAt = new Date();
    await review.save();

    const event = await Event.findById(review.event)
      .select('organizer')
      .lean();

    if (event) {
      await Promise.all([
        updateEventRating(review.event),
        updateOrganizerRating(event.organizer),
      ]);
    }

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

// Helper functions
// Update event average rating and review count
async function updateEventRating(eventId) {
  try {
    const reviews = await Review.find({
      event: eventId,
      isDeleted: false,
    }).lean();

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await Event.findByIdAndUpdate(eventId, {
      'metrics.averageRating': Math.round(averageRating * 10) / 10,
      'metrics.reviewCount': totalReviews,
    });

    console.log(`[Rating Update] Event ${eventId}: ${averageRating.toFixed(1)} (${totalReviews} reviews)`);
  } catch (error) {
    console.error('Update event rating error:', error);
  }
}

// Update organizer average rating across all their events
async function updateOrganizerRating(organizerId) {
  try {
    const events = await Event.find({
      organizer: organizerId,
      isDraft: false,
    })
      .select('_id')
      .lean();

    const eventIds = events.map(e => e._id);

    const reviews = await Review.find({
      event: { $in: eventIds },
      isDeleted: false,
    }).lean();

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await OrganizerProfile.findOneAndUpdate(
      { user: organizerId },
      {
        'metrics.averageRating': Math.round(averageRating * 10) / 10,
        'metrics.totalReviews': totalReviews,
      },
      { upsert: true }
    );

    console.log(`[Rating Update] Organizer ${organizerId}: ${averageRating.toFixed(1)} (${totalReviews} reviews)`);
  } catch (error) {
    console.error('Update organizer rating error:', error);
  }
}