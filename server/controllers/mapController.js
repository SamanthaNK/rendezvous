import Event from '../models/eventModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';

// Get events within map bounds
export const getEventsInBounds = async (req, res) => {
    try {
        const { swLng, swLat, neLng, neLat, category, dateFrom, dateTo, isFree, priceMax } = req.query;

        // Validate required bounding box parameters
        if (!swLng || !swLat || !neLng || !neLat) {
            return res.status(400).json({
                success: false,
                message: 'Bounding box coordinates are required (swLng, swLat, neLng, neLat)',
            });
        }

        const filters = {
            status: 'published',
            isDraft: false,
            'location.coordinates.coordinates': {
                $geoWithin: {
                    $box: [
                        [parseFloat(swLng), parseFloat(swLat)], // Southwest corner
                        [parseFloat(neLng), parseFloat(neLat)]  // Northeast corner
                    ]
                }
            }
        };

        // Apply additional filters
        if (category) {
            filters.categories = category;
        }

        if (dateFrom || dateTo) {
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
        } else if (priceMax) {
            filters.price = { $lte: parseFloat(priceMax) };
        }

        const events = await Event.find(filters)
            .select('_id title categories date location price isFree images metrics organizer')
            .populate('organizer', 'name email')
            .limit(500)
            .lean();

        // Enrich with organizer verification data
        const organizerIds = events.map(e => e.organizer?._id).filter(Boolean);
        const organizerProfiles = await OrganizerProfile.find({
            user: { $in: organizerIds }
        })
            .select('user isVerified verificationBadge')
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
                }
            }
        });

        res.json({
            success: true,
            data: {
                events,
                totalEvents: events.length,
            },
        });
    } catch (error) {
        console.error('Get events in bounds error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: error.message,
        });
    }
};

// Get events within radius
export const getEventsInRadius = async (req, res) => {
    try {
        const { lng, lat, radius = 5000, category, dateFrom, dateTo, isFree, priceMax } = req.query;

        if (!lng || !lat) {
            return res.status(400).json({
                success: false,
                message: 'Longitude and latitude are required',
            });
        }

        const filters = {
            status: 'published',
            isDraft: false,
            'location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        };

        // Apply additional filters
        if (category) {
            filters.categories = category;
        }

        if (dateFrom || dateTo) {
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
        } else if (priceMax) {
            filters.price = { $lte: parseFloat(priceMax) };
        }

        const events = await Event.find(filters)
            .select('_id title categories date location price isFree images metrics organizer')
            .populate('organizer', 'name email')
            .limit(100)
            .lean();

        // Enrich with organizer verification data
        const organizerIds = events.map(e => e.organizer?._id).filter(Boolean);
        const organizerProfiles = await OrganizerProfile.find({
            user: { $in: organizerIds }
        })
            .select('user isVerified verificationBadge')
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
                }
            }
        });

        res.json({
            success: true,
            data: {
                events,
                totalEvents: events.length,
            },
        });
    } catch (error) {
        console.error('Get events in radius error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: error.message,
        });
    }
};