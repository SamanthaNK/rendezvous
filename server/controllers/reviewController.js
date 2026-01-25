import Review from '../models/reviewModel.js';
import Event from '../models/eventModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';

// POST /reviews
export const createReview = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    const userId = req.user._id;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (new Date(event.date) > new Date()) {
      return res.status(400).json({ message: 'Cannot review before event date' });
    }
    const existing = await Review.findOne({ event: eventId, user: userId });
    if (existing) return res.status(400).json({ message: 'You have already reviewed this event' });
    const review = await Review.create({ event: eventId, user: userId, rating, comment });
    await updateEventAverageRating(eventId);
    await updateOrganizerAverageRating(event.organizer);
    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /reviews/event/:eventId
export const getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;
    const reviews = await Review.find({ event: eventId }).populate('user', 'name profilePicture');
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /reviews/:id
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== userId.toString()) return res.status(403).json({ message: 'Not your review' });
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (new Date() - new Date(review.createdAt) > sevenDays) {
      return res.status(400).json({ message: 'Edit window expired' });
    }
    review.rating = rating;
    review.comment = comment;
    await review.save();
    await updateEventAverageRating(review.event);
    await updateOrganizerAverageRatingFromReview(review.event);
    res.json({ review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== userId.toString()) return res.status(403).json({ message: 'Not your review' });
    await review.remove();
    await updateEventAverageRating(review.event);
    await updateOrganizerAverageRatingFromReview(review.event);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Helpers
async function updateEventAverageRating(eventId) {
  const reviews = await Review.find({ event: eventId });
  const avg = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
  await Event.findByIdAndUpdate(eventId, { 'metrics.averageRating': Math.round(avg * 10) / 10 });
}

async function updateOrganizerAverageRating(organizerId) {
  const events = await Event.find({ organizer: organizerId });
  const eventIds = events.map(e => e._id);
  const reviews = await Review.find({ event: { $in: eventIds } });
  const avg = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
  await OrganizerProfile.findOneAndUpdate({ user: organizerId }, { 'metrics.averageRating': Math.round(avg * 10) / 10 });
}

async function updateOrganizerAverageRatingFromReview(eventId) {
  const event = await Event.findById(eventId);
  if (event) await updateOrganizerAverageRating(event.organizer);
}
