import mongoose from 'mongoose';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';
import { deleteMultipleImages } from '../services/cloudinaryService.js';
import { generateEventEmbedding, findSimilarEvents } from '../services/aiService.js';
import { getPersonalizedFeed } from '../services/recommendationService.js';

// Cache for personalized feeds
const feedCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getFeedCache = (key) => {
  const cached = feedCache.get(key);
  if (!cached || Date.now() - cached.timestamp > CACHE_TTL) {
    feedCache.delete(key);
    return null;
  }
  return cached.data;
};

// Get all events with filtering and pagination
export const getAllEvents = async (req, res) => {
    try {
        const {
            category,
            city,
            neighborhood,
            date,
            dateFrom,
            dateTo,
            price,
            priceMin,
            priceMax,
            eventType,
            isFree,
            search,
            page = 1,
            limit = 20,
            sort = '-publishedAt',
        } = req.query;

        const filters = { status: 'published', isDraft: false };

        if (category) {
            filters.categories = category;
        }

        if (city) {
            filters['location.city'] = new RegExp(city, 'i');
        }

        if (neighborhood) {
            filters['location.neighborhood'] = new RegExp(neighborhood, 'i');
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            filters.date = { $gte: startOfDay, $lte: endOfDay };
        } else if (dateFrom || dateTo) {
            filters.date = {};
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                filters.date.$gte = fromDate;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                filters.date.$lte = toDate;
            }
        }

        if (isFree === 'true') {
            filters.isFree = true;
        } else if (price) {
            filters.price = { $lte: parseFloat(price) };
        } else if (priceMin || priceMax) {
            filters.price = {};
            if (priceMin) {
                filters.price.$gte = parseFloat(priceMin);
            }
            if (priceMax) {
                filters.price.$lte = parseFloat(priceMax);
            }
        }

        if (eventType) {
            filters.eventType = eventType;
        }

        if (search) {
            filters.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const events = await Event.find(filters)
            .select('title description categories date time location price isFree images metrics organizer status')
            .populate('organizer', 'name email isEmailVerified')
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const organizerIds = events.map(e => e.organizer?._id).filter(Boolean);
        const organizerProfiles = await OrganizerProfile.find({
            user: { $in: organizerIds }
        })
            .select('user isVerified verificationBadge metrics.averageRating')
            .lean();

        const profileMap = {};
        organizerProfiles.forEach(profile => {
            profileMap[profile.user.toString()] = profile;
        });

        events.forEach(event => {
            if (event.organizer?._id) {
                const profile = profileMap[event.organizer._id.toString()];
                if (profile) {
                    event.organizer.isVerified = profile.isVerified;
                    event.organizer.verificationBadge = profile.verificationBadge;
                    event.organizer.averageRating = profile.metrics?.averageRating || 0;
                }
            }
        });

        const total = await Event.countDocuments(filters);

        res.json({
            success: true,
            data: {
                events,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalEvents: total,
                    eventsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error('Get all events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: error.message,
        });
    }
};

// Get single event by ID with similar events
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id)
            .populate('organizer', 'name email profilePicture')
            .lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        Event.findByIdAndUpdate(id, { $inc: { 'metrics.views': 1 } }).exec();

        const organizerProfile = await OrganizerProfile.findOne({
            user: event.organizer._id,
        })
            .select('isVerified verificationBadge metrics.averageRating')
            .lean();

        const eventWithOrganizerInfo = {
            ...event,
            organizer: {
                ...event.organizer,
                isVerified: organizerProfile?.isVerified || false,
                verificationBadge: organizerProfile?.verificationBadge || 'none',
                averageRating: organizerProfile?.metrics?.averageRating || 0,
            },
        };

        if (event.embedding && Array.isArray(event.embedding) && event.embedding.length > 0) {
            const similarEventsQuery = await Event.find({
                _id: { $ne: id },
                status: 'published',
                isDraft: false,
                embedding: { $exists: true, $ne: [] },
            })
                .select('_id title categories date location price isFree images metrics embedding')
                .lean();

            const similarEvents = findSimilarEvents(event.embedding, similarEventsQuery, 3);

            eventWithOrganizerInfo.similarEvents = similarEvents.map(s => ({
                ...s.event,
                similarityScore: s.similarity,
            }));
        }

        res.json({
            success: true,
            data: { event: eventWithOrganizerInfo },
        });
    } catch (error) {
        console.error('Get event by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event',
            error: error.message,
        });
    }
};

// Get similar events based on embeddings
export const getSimilarEvents = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 6 } = req.query;

        const event = await Event.findById(id)
            .select('_id embedding categories')
            .lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        let similarEvents = [];

        if (event.embedding && Array.isArray(event.embedding) && event.embedding.length > 0) {
            const candidateEvents = await Event.find({
                _id: { $ne: id },
                status: 'published',
                isDraft: false,
                embedding: { $exists: true, $ne: [] },
            })
                .select('_id title categories date location price isFree images metrics organizer embedding')
                .populate('organizer', 'name email')
                .lean();

            const { findSimilarEvents } = await import('../services/aiService.js');
            const similarities = findSimilarEvents(event.embedding, candidateEvents, parseInt(limit));

            similarEvents = similarities.map(s => ({
                ...s.event,
                similarityScore: s.similarity,
            }));
        } else {
            similarEvents = await Event.find({
                _id: { $ne: id },
                categories: { $in: event.categories },
                status: 'published',
                isDraft: false,
            })
                .select('_id title categories date location price isFree images metrics organizer')
                .populate('organizer', 'name email')
                .limit(parseInt(limit))
                .lean();
        }

        res.json({
            success: true,
            data: {
                events: similarEvents,
                total: similarEvents.length,
            },
        });
    } catch (error) {
        console.error('Get similar events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch similar events',
            error: error.message,
        });
    }
};

// Get events near user location
export const getNearbyEvents = async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 50000, limit = 20 } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Longitude and latitude are required',
            });
        }

        const events = await Event.find({
            status: 'published',
            isDraft: false,
            'location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                    $maxDistance: parseInt(maxDistance),
                },
            },
        })
            .select('title categories date location price isFree images metrics organizer')
            .populate('organizer', 'name email')
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: {
                events,
                totalEvents: events.length,
            },
        });
    } catch (error) {
        console.error('Get nearby events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch nearby events',
            error: error.message,
        });
    }
};

// Create new event with embedding generation
export const createEvent = async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            organizer: req.user._id,
            isDraft: req.body.isDraft !== false,
            status: req.body.isDraft === false ? 'published' : 'draft',
            date: new Date(req.body.date),
        };

        if (eventData.status === 'published') {
            eventData.publishedAt = new Date();
        }

        const event = await Event.create(eventData);

        if (eventData.status === 'published') {
            console.log(`[Event Create] Generating embedding for event: ${event._id}`);

            const eventText = `${event.title} ${event.description} ${event.categories.join(' ')}`;
            const embedding = await generateEventEmbedding(eventText);

            if (embedding) {
                await Event.findByIdAndUpdate(event._id, { embedding });
                console.log(`[Event Create] Embedding saved for event: ${event._id}`);
            } else {
                console.warn(`[Event Create] Failed to generate embedding for event: ${event._id}`);
            }
        }

        await OrganizerProfile.updateMetrics(req.user._id);

        res.status(201).json({
            success: true,
            data: { event },
            message: eventData.isDraft
                ? 'Event saved as draft'
                : 'Event created and published successfully',
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create event',
            error: error.message,
        });
    }
};

// Update event and regenerate embedding if needed
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id).lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        if (event.organizer.toString() !== req.user._id.toString() && !req.user.isAdmin()) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own events',
            });
        }

        if (event.status === 'past') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit past events',
            });
        }

        const updateData = { ...req.body };

        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }

        if (event.isDraft && req.body.isDraft === false) {
            updateData.status = 'published';
            updateData.publishedAt = new Date();
            updateData.isDraft = false;
        }

        const contentChanged =
            updateData.title !== event.title ||
            updateData.description !== event.description ||
            JSON.stringify(updateData.categories) !== JSON.stringify(event.categories);

        if (contentChanged && updateData.status === 'published') {
            console.log(`[Event Update] Content changed, regenerating embedding for: ${id}`);

            const eventText = `${updateData.title || event.title} ${updateData.description || event.description} ${(updateData.categories || event.categories).join(' ')}`;
            const embedding = await generateEventEmbedding(eventText);

            if (embedding) {
                updateData.embedding = embedding;
                console.log(`[Event Update] Embedding updated for event: ${id}`);
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate('organizer', 'name email')
            .lean();

        res.json({
            success: true,
            data: { event: updatedEvent },
            message: 'Event updated successfully',
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event',
            error: error.message,
        });
    }
};

// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id).lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        if (event.organizer.toString() !== req.user._id.toString() && !req.user.isAdmin()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own events',
            });
        }

        const publicIds = event.images
            .filter((url) => url.includes('cloudinary.com'))
            .map((url) => {
                const parts = url.split('/');
                const filename = parts[parts.length - 1];
                const folder = parts[parts.length - 2];
                return `rendezvous/${folder}/${filename.split('.')[0]}`;
            });

        if (publicIds.length > 0) {
            try {
                await deleteMultipleImages(publicIds);
            } catch (imageError) {
                console.error('Failed to delete images from Cloudinary:', imageError);
            }
        }

        await Event.findByIdAndDelete(id);

        User.updateMany(
            { $or: [{ savedEvents: id }, { interestedEvents: id }] },
            { $pull: { savedEvents: id, interestedEvents: id } }
        ).exec();

        await OrganizerProfile.updateMetrics(req.user._id);

        res.json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete event',
            error: error.message,
        });
    }
};

// Save event
export const saveEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id).select('_id').lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        const user = await User.findById(req.user._id).select('savedEvents').lean();

        if (user.savedEvents.some(eventId => eventId.toString() === id)) {
            return res.status(400).json({
                success: false,
                message: 'Event already saved',
            });
        }

        await Promise.all([
            User.findByIdAndUpdate(req.user._id, { $push: { savedEvents: id } }),
            Event.findByIdAndUpdate(id, { $inc: { 'metrics.saves': 1 } })
        ]);

        res.json({
            success: true,
            message: 'Event saved successfully',
        });
    } catch (error) {
        console.error('Save event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save event',
            error: error.message,
        });
    }
};

// Unsave event
export const unsaveEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(req.user._id).select('savedEvents').lean();

        if (!user.savedEvents.some(eventId => eventId.toString() === id)) {
            return res.status(400).json({
                success: false,
                message: 'Event not in saved list',
            });
        }

        await Promise.all([
            User.findByIdAndUpdate(req.user._id, { $pull: { savedEvents: id } }),
            Event.findByIdAndUpdate(id, { $inc: { 'metrics.saves': -1 } })
        ]);

        res.json({
            success: true,
            message: 'Event removed from saved list',
        });
    } catch (error) {
        console.error('Unsave event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unsave event',
            error: error.message,
        });
    }
};

// Mark interested
export const markInterested = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id).select('_id interestedUsers').lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        const user = await User.findById(req.user._id).select('interestedEvents').lean();

        if (user.interestedEvents.some(eventId => eventId.toString() === id)) {
            return res.status(400).json({
                success: false,
                message: 'Already marked as interested',
            });
        }

        await Promise.all([
            User.findByIdAndUpdate(req.user._id, { $push: { interestedEvents: id } }),
            Event.findByIdAndUpdate(id, {
                $push: { interestedUsers: req.user._id },
                $inc: { 'metrics.interested': 1 }
            })
        ]);

        res.json({
            success: true,
            message: 'Marked as interested successfully',
        });
    } catch (error) {
        console.error('Mark interested error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark as interested',
            error: error.message,
        });
    }
};

// Unmark interested
export const unmarkInterested = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(req.user._id).select('interestedEvents').lean();

        if (!user.interestedEvents.some(eventId => eventId.toString() === id)) {
            return res.status(400).json({
                success: false,
                message: 'Event not in interested list',
            });
        }

        await Promise.all([
            User.findByIdAndUpdate(req.user._id, { $pull: { interestedEvents: id } }),
            Event.findByIdAndUpdate(id, {
                $pull: { interestedUsers: req.user._id },
                $inc: { 'metrics.interested': -1 }
            })
        ]);

        res.json({
            success: true,
            message: 'Removed from interested list',
        });
    } catch (error) {
        console.error('Unmark interested error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove from interested list',
            error: error.message,
        });
    }
};

// Get user's saved events
export const getSavedEvents = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const user = await User.findById(req.user._id).select('savedEvents').lean();

        const events = await Event.find({
            _id: { $in: user.savedEvents }
        })
            .select('title categories date location price isFree images metrics organizer')
            .populate('organizer', 'name email')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = user.savedEvents.length;

        res.json({
            success: true,
            data: {
                events,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalEvents: total,
                },
            },
        });
    } catch (error) {
        console.error('Get saved events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch saved events',
            error: error.message,
        });
    }
};

// Get user's interested events
export const getInterestedEvents = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const user = await User.findById(req.user._id).select('interestedEvents').lean();

        const events = await Event.find({
            _id: { $in: user.interestedEvents }
        })
            .select('title categories date location price isFree images metrics organizer')
            .populate('organizer', 'name email')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = user.interestedEvents.length;

        res.json({
            success: true,
            data: {
                events,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalEvents: total,
                },
            },
        });
    } catch (error) {
        console.error('Get interested events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interested events',
            error: error.message,
        });
    }
};

// Get organizer's events
export const getMyEvents = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filters = { organizer: req.user._id };

        if (status) {
            filters.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const events = await Event.find(filters)
            .select('title categories date status isDraft metrics images')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = await Event.countDocuments(filters);

        res.json({
            success: true,
            data: {
                events,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalEvents: total,
                },
            },
        });
    } catch (error) {
        console.error('Get my events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your events',
            error: error.message,
        });
    }
};

// Get trending events based on engagement
const getTrendingEvents = async (userId, limit = 5) => {
    try {
        const user = await User.findById(userId)
            .select('savedEvents interestedEvents')
            .lean();

        const excludeEventIds = [
            ...user.savedEvents.map(id => id.toString()),
            ...user.interestedEvents.map(id => id.toString())
        ];

        // Calculate engagement score: saves * 2 + interested * 1
        const trendingEvents = await Event.aggregate([
            {
                $match: {
                    _id: { $nin: excludeEventIds.map(id => new mongoose.Types.ObjectId(id)) },
                    status: 'published',
                    isDraft: false,
                    date: { $gte: new Date() }
                }
            },
            {
                $addFields: {
                    engagementScore: {
                        $add: [
                            { $multiply: [{ $ifNull: ['$metrics.saves', 0] }, 2] },
                            { $ifNull: ['$metrics.interested', 0] }
                        ]
                    }
                }
            },
            {
                $sort: { engagementScore: -1 }
            },
            {
                $limit: limit
            }
        ]);

        const populatedEvents = await Event.populate(trendingEvents, {
            path: 'organizer',
            select: 'name email'
        });

        return populatedEvents.map(event => ({
            ...event,
            isTrending: true,
            explanation: 'Trending now'
        }));
    } catch (error) {
        console.error('[Trending Events] Error:', error);
        return [];
    }
};

// Get events from followed organizers
const getFollowedOrganizerEvents = async (userId, limit = 5) => {
    try {
        const user = await User.findById(userId)
            .select('followedOrganizers savedEvents interestedEvents')
            .lean();

        if (!user.followedOrganizers || user.followedOrganizers.length === 0) {
            return [];
        }

        const excludeEventIds = [
            ...user.savedEvents.map(id => id.toString()),
            ...user.interestedEvents.map(id => id.toString())
        ];

        const events = await Event.find({
            organizer: { $in: user.followedOrganizers },
            _id: { $nin: excludeEventIds },
            status: 'published',
            isDraft: false,
            date: { $gte: new Date() }
        })
            .select('title description categories date location price isFree images metrics organizer')
            .populate('organizer', 'name email')
            .sort('-publishedAt')
            .limit(limit)
            .lean();

        return events.map(event => ({
            ...event,
            fromFollowedOrganizer: true,
            explanation: `New from ${event.organizer.name}`
        }));
    } catch (error) {
        console.error('[Followed Organizers] Error:', error);
        return [];
    }
};

// Mix different event sources
const mixFeedEvents = (recommended, followed, trending) => {
    const mixed = [];
    const seenIds = new Set();

    // Add followed organizer events first (highest priority)
    for (const event of followed) {
        const eventId = event._id.toString();
        if (!seenIds.has(eventId)) {
            mixed.push(event);
            seenIds.add(eventId);
        }
    }

    // Mesh recommended and trending events
    const maxLength = Math.max(recommended.length, trending.length);

    for (let i = 0; i < maxLength; i++) {
        // Add 3 recommended events
        for (let j = 0; j < 3 && i * 3 + j < recommended.length; j++) {
            const event = recommended[i * 3 + j];
            const eventId = event._id.toString();
            if (!seenIds.has(eventId)) {
                mixed.push(event);
                seenIds.add(eventId);
            }
        }

        // Add 1 trending event
        if (i < trending.length) {
            const event = trending[i];
            const eventId = event._id.toString();
            if (!seenIds.has(eventId)) {
                mixed.push(event);
                seenIds.add(eventId);
            }
        }
    }

    return mixed;
};

// Get personalized event feed
export const getEventFeed = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { page = 1, limit = 12, refresh = 'false' } = req.query;

        console.log(`[Feed] User: ${userId}, Page: ${page}, Refresh: ${refresh}`);

        const cacheKey = `${userId}-${page}-${limit}`;
        const now = Date.now();

        // Check cache
        if (refresh !== 'true' && feedCache.has(cacheKey)) {
            const cached = feedCache.get(cacheKey);
            if (now - cached.timestamp < CACHE_TTL) {
                console.log('[Feed] Returning cached results');
                return res.json({
                    success: true,
                    data: cached.data,
                    message: 'Personalized feed retrieved',
                    cached: true
                });
            } else {
                feedCache.delete(cacheKey);
            }
        }

        if (parseInt(page) === 1) {
            console.log('[Feed] Generating fresh feed for page 1');

            // Get personalized recommendations (60% of feed)
            const recommendedCount = Math.ceil(parseInt(limit) * 0.6);
            const recommendedResult = await getPersonalizedFeed(
                userId,
                1,
                recommendedCount
            );

            // Get followed organizer events (20% of feed)
            const followedCount = Math.ceil(parseInt(limit) * 0.2);
            const followedEvents = await getFollowedOrganizerEvents(
                userId,
                followedCount
            );

            // Get trending events (20% of feed)
            const trendingCount = Math.ceil(parseInt(limit) * 0.2);
            const trendingEvents = await getTrendingEvents(userId, trendingCount);

            // Mix all sources
            const mixedEvents = mixFeedEvents(
                recommendedResult.events,
                followedEvents,
                trendingEvents
            );

            const finalEvents = mixedEvents.slice(0, parseInt(limit));

            const organizerIds = finalEvents.map(e => e.organizer?._id).filter(Boolean);
            const organizerProfiles = await OrganizerProfile.find({
                user: { $in: organizerIds }
            })
                .select('user isVerified verificationBadge metrics.averageRating')
                .lean();

            const profileMap = {};
            organizerProfiles.forEach(profile => {
                profileMap[profile.user.toString()] = profile;
            });

            finalEvents.forEach(event => {
                if (event.organizer?._id) {
                    const profile = profileMap[event.organizer._id.toString()];
                    if (profile) {
                        event.organizer.isVerified = profile.isVerified;
                        event.organizer.verificationBadge = profile.verificationBadge;
                    }
                }
            });

            const responseData = {
                events: finalEvents,
                pagination: {
                    currentPage: 1,
                    hasMore: mixedEvents.length > parseInt(limit),
                    totalInFeed: mixedEvents.length
                },
                feedComposition: {
                    recommended: recommendedResult.events.length,
                    followed: followedEvents.length,
                    trending: trendingEvents.length,
                    isColdStart: recommendedResult.isColdStart
                }
            };

            // Cache the result
            feedCache.set(cacheKey, {
                data: responseData,
                timestamp: now
            });

            return res.json({
                success: true,
                data: responseData,
                message: 'Personalized feed retrieved',
                cached: false
            });
        }

        // For subsequent pages, use pure recommendations
        console.log(`[Feed] Fetching recommendations for page ${page}`);

        const recommendedResult = await getPersonalizedFeed(
            userId,
            parseInt(page),
            parseInt(limit)
        );

        // Populate organizer profile data
        const organizerIds = recommendedResult.events.map(e => e.organizer?._id).filter(Boolean);
        const organizerProfiles = await OrganizerProfile.find({
            user: { $in: organizerIds }
        })
            .select('user isVerified verificationBadge metrics.averageRating')
            .lean();

        const profileMap = {};
        organizerProfiles.forEach(profile => {
            profileMap[profile.user.toString()] = profile;
        });

        recommendedResult.events.forEach(event => {
            if (event.organizer?._id) {
                const profile = profileMap[event.organizer._id.toString()];
                if (profile) {
                    event.organizer.isVerified = profile.isVerified;
                    event.organizer.verificationBadge = profile.verificationBadge;
                }
            }
        });

        const responseData = {
            events: recommendedResult.events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: recommendedResult.pagination.totalPages,
                hasMore: parseInt(page) < recommendedResult.pagination.totalPages
            },
            feedComposition: {
                recommended: recommendedResult.events.length,
                followed: 0,
                trending: 0,
                isColdStart: recommendedResult.isColdStart
            }
        };

        // Cache the result
        feedCache.set(cacheKey, {
            data: responseData,
            timestamp: now
        });

        return res.json({
            success: true,
            data: responseData,
            message: 'Personalized feed retrieved',
            cached: false
        });
    } catch (error) {
        console.error('[Feed] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load personalized feed',
            error: error.message
        });
    }
};

// Clear user's feed cache (useful after user updates interests)
export const clearUserFeedCache = (userId) => {
    const userIdStr = userId.toString();
    for (const key of feedCache.keys()) {
        if (key.startsWith(userIdStr)) {
            feedCache.delete(key);
        }
    }
    console.log(`[Feed Cache] Cleared cache for user: ${userIdStr}`);
};