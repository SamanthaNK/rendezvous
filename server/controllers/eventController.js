import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';
import { deleteMultipleImages } from '../services/cloudinaryService.js';

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
                filters.date.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                filters.date.$lte = new Date(dateTo);
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

        // Attach organizer verification info
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

// Get single event by ID
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

// Create new event
export const createEvent = async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            organizer: req.user._id,
            isDraft: req.body.isDraft !== false,
            status: req.body.isDraft === false ? 'published' : 'draft',
        };

        if (eventData.status === 'published') {
            eventData.publishedAt = new Date();
        }

        const event = await Event.create(eventData);

        OrganizerProfile.updateMetrics(req.user._id).exec();

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

// Update event
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

        if (event.isDraft && req.body.isDraft === false) {
            updateData.status = 'published';
            updateData.publishedAt = new Date();
            updateData.isDraft = false;
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

        // Extract Cloudinary public IDs
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

        OrganizerProfile.updateMetrics(event.organizer).exec();

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