import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';
import VerificationRequest from '../models/verificationRequestModel.js';
import Review from '../models/reviewModel.js';

// Get organizer dashboard overview with stats
export const getDashboard = async (req, res) => {
    try {
        const organizerId = req.user._id;

        // Get organizer profile with metrics
        let organizerProfile = await OrganizerProfile.findOne({ user: organizerId })
            .select('metrics isVerified verifiedAt')
            .lean();

        // Create profile if doesn't exist
        if (!organizerProfile) {
            organizerProfile = await OrganizerProfile.create({
                user: organizerId,
                metrics: {
                    totalEvents: 0,
                    upcomingEvents: 0,
                    pastEvents: 0,
                    totalViews: 0,
                    totalSaves: 0,
                    totalInterested: 0,
                    followerCount: 0,
                    averageRating: 0,
                    totalReviews: 0,
                },
            });
        }

        // Get follower count (users who follow this organizer)
        const followerCount = await User.countDocuments({
            followedOrganizers: organizerId,
        });

        // Get recent events (last 5)
        const recentEvents = await Event.find({
            organizer: organizerId,
            isDraft: false,
        })
            .select('title status date metrics createdAt')
            .sort('-createdAt')
            .limit(5)
            .lean();

        // Calculate quick stats from events
        const totalEvents = await Event.countDocuments({
            organizer: organizerId,
            isDraft: false,
        });

        const upcomingEvents = await Event.countDocuments({
            organizer: organizerId,
            status: 'published',
            isDraft: false,
            date: { $gte: new Date() },
        });

        const draftEvents = await Event.countDocuments({
            organizer: organizerId,
            isDraft: true,
        });

        // Aggregate total views, saves, and interested
        const metricsAggregation = await Event.aggregate([
            {
                $match: {
                    organizer: organizerId,
                    isDraft: false,
                },
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$metrics.views' },
                    totalSaves: { $sum: '$metrics.saves' },
                    totalInterested: { $sum: '$metrics.interested' },
                },
            },
        ]);

        const metrics = metricsAggregation.length > 0
            ? metricsAggregation[0]
            : { totalViews: 0, totalSaves: 0, totalInterested: 0 };

        // Get average rating across all events
        const reviewStats = await Review.aggregate([
            {
                $lookup: {
                    from: 'events',
                    localField: 'event',
                    foreignField: '_id',
                    as: 'eventData',
                },
            },
            {
                $unwind: '$eventData',
            },
            {
                $match: {
                    'eventData.organizer': organizerId,
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        const ratingData = reviewStats.length > 0
            ? {
                averageRating: Math.round(reviewStats[0].averageRating * 10) / 10,
                totalReviews: reviewStats[0].totalReviews,
            }
            : { averageRating: 0, totalReviews: 0 };

        // Format recent activity
        const recentActivity = recentEvents.map((event) => ({
            eventId: event._id,
            title: event.title,
            status: event.status,
            date: event.date,
            views: event.metrics?.views || 0,
            saves: event.metrics?.saves || 0,
            interested: event.metrics?.interested || 0,
            createdAt: event.createdAt,
        }));

        res.json({
            success: true,
            data: {
                stats: {
                    totalEvents,
                    upcomingEvents,
                    draftEvents,
                    totalViews: metrics.totalViews,
                    totalSaves: metrics.totalSaves,
                    totalInterested: metrics.totalInterested,
                    followerCount,
                    averageRating: ratingData.averageRating,
                    totalReviews: ratingData.totalReviews,
                },
                isVerified: organizerProfile.isVerified || false,
                verifiedAt: organizerProfile.verifiedAt || null,
                recentActivity,
            },
            message: 'Dashboard data retrieved successfully',
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message,
        });
    }
};

// Get organizer profile
export const getProfile = async (req, res) => {
    try {
        const organizerId = req.user._id;

        const user = await User.findById(organizerId)
            .select('name email role createdAt')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        let profile = await OrganizerProfile.findOne({ user: organizerId }).lean();

        if (!profile) {
            profile = await OrganizerProfile.create({
                user: organizerId,
                metrics: {
                    totalEvents: 0,
                    upcomingEvents: 0,
                    pastEvents: 0,
                    totalViews: 0,
                    totalSaves: 0,
                    totalInterested: 0,
                    followerCount: 0,
                    averageRating: 0,
                    totalReviews: 0,
                },
            });
        }

        const followerCount = await User.countDocuments({
            followedOrganizers: organizerId,
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt,
                },
                profile: {
                    organizationName: profile.organizationName || '',
                    bio: profile.bio || '',
                    website: profile.website || '',
                    socialLinks: profile.socialLinks || {},
                    isVerified: profile.isVerified || false,
                    verifiedAt: profile.verifiedAt || null,
                    verificationBadge: profile.verificationBadge || 'none',
                    contactInfo: profile.contactInfo || {},
                    metrics: {
                        ...profile.metrics,
                        followerCount,
                    },
                    accountStatus: profile.accountStatus || 'active',
                },
            },
            message: 'Profile retrieved successfully',
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message,
        });
    }
};

// Update organizer profile
export const updateProfile = async (req, res) => {
    try {
        const organizerId = req.user._id;
        const {
            organizationName,
            bio,
            website,
            socialLinks,
            contactInfo,
        } = req.body;

        const updateData = {};

        if (organizationName !== undefined) {
            updateData.organizationName = organizationName.trim();
        }

        if (bio !== undefined) {
            if (bio.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Bio cannot exceed 1000 characters',
                });
            }
            updateData.bio = bio.trim();
        }

        if (website !== undefined) {
            updateData.website = website.trim();
        }

        if (socialLinks !== undefined) {
            updateData.socialLinks = {
                facebook: socialLinks.facebook?.trim() || '',
                instagram: socialLinks.instagram?.trim() || '',
                tiktok: socialLinks.tiktok?.trim() || '',
                twitter: socialLinks.twitter?.trim() || '',
                linkedin: socialLinks.linkedin?.trim() || '',
            };
        }

        if (contactInfo !== undefined) {
            updateData.contactInfo = {
                businessPhone: contactInfo.businessPhone?.trim() || '',
                businessEmail: contactInfo.businessEmail?.trim() || '',
                physicalAddress: contactInfo.physicalAddress?.trim() || '',
            };
        }

        const profile = await OrganizerProfile.findOneAndUpdate(
            { user: organizerId },
            { $set: updateData },
            { new: true, upsert: true, runValidators: true }
        ).lean();

        res.json({
            success: true,
            data: { profile },
            message: 'Profile updated successfully',
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
};

// Request verification
export const requestVerification = async (req, res) => {
    try {
        const organizerId = req.user._id;

        const existingRequest = await VerificationRequest.findOne({
            organizer: organizerId,
            status: { $in: ['pending', 'under-review'] },
        }).lean();

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending verification request',
            });
        }

        const profile = await OrganizerProfile.findOne({ user: organizerId })
            .select('isVerified')
            .lean();

        if (profile?.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Your account is already verified',
            });
        }

        const {
            organizationName,
            registrationNumber,
            contactPerson,
            physicalAddress,
            documents,
            socialMediaLinks,
            previousEvents,
            additionalInfo,
        } = req.body;

        if (!organizationName || !contactPerson || !physicalAddress) {
            return res.status(400).json({
                success: false,
                message: 'Organization name, contact person, and physical address are required',
            });
        }

        if (!contactPerson.fullName || !contactPerson.phone || !contactPerson.email) {
            return res.status(400).json({
                success: false,
                message: 'Contact person must have full name, phone, and email',
            });
        }

        const verificationRequest = await VerificationRequest.create({
            organizer: organizerId,
            organizationName: organizationName.trim(),
            registrationNumber: registrationNumber?.trim() || '',
            contactPerson: {
                fullName: contactPerson.fullName.trim(),
                position: contactPerson.position?.trim() || '',
                phone: contactPerson.phone.trim(),
                email: contactPerson.email.trim(),
            },
            physicalAddress: physicalAddress.trim(),
            documents: documents || {},
            socialMediaLinks: socialMediaLinks || {},
            previousEvents: previousEvents?.trim() || '',
            additionalInfo: additionalInfo?.trim() || '',
            status: 'pending',
        });

        res.status(201).json({
            success: true,
            data: {
                request: {
                    id: verificationRequest._id,
                    status: verificationRequest.status,
                    submittedAt: verificationRequest.createdAt,
                },
            },
            message: 'Verification request submitted successfully. We will review it shortly.',
        });
    } catch (error) {
        console.error('Request verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit verification request',
            error: error.message,
        });
    }
};

// Get verification status
export const getVerificationStatus = async (req, res) => {
    try {
        const organizerId = req.user._id;

        const profile = await OrganizerProfile.findOne({ user: organizerId })
            .select('isVerified verifiedAt verificationBadge')
            .lean();

        const verificationRequest = await VerificationRequest.findOne({
            organizer: organizerId,
        })
            .select('status createdAt reviewedAt reviewNotes rejectionReason improvementSuggestions reapplicationCount')
            .sort('-createdAt')
            .lean();

        const canReapply = verificationRequest?.canReapply
            ? verificationRequest.canReapply()
            : false;

        res.json({
            success: true,
            data: {
                isVerified: profile?.isVerified || false,
                verifiedAt: profile?.verifiedAt || null,
                verificationBadge: profile?.verificationBadge || 'none',
                request: verificationRequest
                    ? {
                        status: verificationRequest.status,
                        submittedAt: verificationRequest.createdAt,
                        reviewedAt: verificationRequest.reviewedAt || null,
                        reviewNotes: verificationRequest.reviewNotes || null,
                        rejectionReason: verificationRequest.rejectionReason || null,
                        improvementSuggestions: verificationRequest.improvementSuggestions || null,
                        reapplicationCount: verificationRequest.reapplicationCount || 0,
                        canReapply,
                    }
                    : null,
            },
            message: 'Verification status retrieved successfully',
        });
    } catch (error) {
        console.error('Get verification status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch verification status',
            error: error.message,
        });
    }
};

// Get all organizer events with status filtering
export const getOrganizerEvents = async (req, res) => {
    try {
        const organizerId = req.user._id;
        const { status, page = 1, limit = 20 } = req.query;

        const filters = { organizer: organizerId };

        if (status === 'draft') {
            filters.isDraft = true;
        } else if (status === 'published') {
            filters.isDraft = false;
            filters.status = 'published';
        } else if (status === 'past') {
            filters.isDraft = false;
            filters.status = 'past';
        } else if (status === 'cancelled') {
            filters.status = 'cancelled';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const events = await Event.find(filters)
            .select('title categories date status isDraft metrics images createdAt publishedAt')
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
            message: 'Events retrieved successfully',
        });
    } catch (error) {
        console.error('Get organizer events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: error.message,
        });
    }
};

// Get detailed analytics for a specific event
export const getEventAnalytics = async (req, res) => {
    try {
        const { eventId } = req.params;
        const organizerId = req.user._id;

        const event = await Event.findOne({
            _id: eventId,
            organizer: organizerId,
        })
            .select('title date status metrics interestedUsers createdAt publishedAt')
            .lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found or you do not have permission to view its analytics',
            });
        }

        const interestedUsers = await User.find({
            _id: { $in: event.interestedUsers || [] },
        })
            .select('location.city')
            .lean();

        const geographicDistribution = interestedUsers.reduce((acc, user) => {
            const city = user.location?.city || 'Unknown';
            acc[city] = (acc[city] || 0) + 1;
            return acc;
        }, {});

        const geographicData = Object.entries(geographicDistribution)
            .map(([city, count]) => ({ city, count }))
            .sort((a, b) => b.count - a.count);

        const reviewStats = await Review.aggregate([
            {
                $match: {
                    event: event._id,
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$rating',
                    },
                },
            },
        ]);

        let ratingsData = {
            averageRating: 0,
            totalReviews: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };

        if (reviewStats.length > 0) {
            const stats = reviewStats[0];
            ratingsData.averageRating = Math.round(stats.averageRating * 10) / 10;
            ratingsData.totalReviews = stats.totalReviews;

            stats.ratingDistribution.forEach((rating) => {
                ratingsData.distribution[rating] = (ratingsData.distribution[rating] || 0) + 1;
            });
        }

        const viewsOverTime = [
            {
                date: event.createdAt,
                views: 0,
            },
            {
                date: new Date(),
                views: event.metrics?.views || 0,
            },
        ];

        const savesOverTime = [
            {
                date: event.createdAt,
                saves: 0,
            },
            {
                date: new Date(),
                saves: event.metrics?.saves || 0,
            },
        ];

        const interestedOverTime = [
            {
                date: event.createdAt,
                interested: 0,
            },
            {
                date: new Date(),
                interested: event.metrics?.interested || 0,
            },
        ];

        const totalViews = event.metrics?.views || 0;
        const totalEngagements = (event.metrics?.saves || 0) + (event.metrics?.interested || 0);
        const engagementRate = totalViews > 0
            ? Math.round((totalEngagements / totalViews) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                event: {
                    id: event._id,
                    title: event.title,
                    date: event.date,
                    status: event.status,
                    createdAt: event.createdAt,
                    publishedAt: event.publishedAt,
                },
                metrics: {
                    totalViews: event.metrics?.views || 0,
                    totalSaves: event.metrics?.saves || 0,
                    totalInterested: event.metrics?.interested || 0,
                    engagementRate,
                },
                viewsOverTime,
                savesOverTime,
                interestedOverTime,
                geographicDistribution: geographicData,
                ratings: ratingsData,
            },
            message: 'Event analytics retrieved successfully',
        });
    } catch (error) {
        console.error('Get event analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event analytics',
            error: error.message,
        });
    }
};

// Get organizer performance metrics
export const getPerformanceMetrics = async (req, res) => {
    try {
        const organizerId = req.user._id;

        const events = await Event.find({
            organizer: organizerId,
            isDraft: false,
            status: { $in: ['published', 'past'] },
        })
            .select('title date status metrics')
            .lean();

        if (events.length === 0) {
            return res.json({
                success: true,
                data: {
                    topPerformingEvents: [],
                    totalEngagement: 0,
                    averageViewsPerEvent: 0,
                    averageSavesPerEvent: 0,
                    averageInterestedPerEvent: 0,
                },
                message: 'No published events found',
            });
        }

        const totalViews = events.reduce((sum, e) => sum + (e.metrics?.views || 0), 0);
        const totalSaves = events.reduce((sum, e) => sum + (e.metrics?.saves || 0), 0);
        const totalInterested = events.reduce((sum, e) => sum + (e.metrics?.interested || 0), 0);

        const averageViewsPerEvent = Math.round(totalViews / events.length);
        const averageSavesPerEvent = Math.round(totalSaves / events.length);
        const averageInterestedPerEvent = Math.round(totalInterested / events.length);

        const topPerformingEvents = events
            .map((event) => ({
                id: event._id,
                title: event.title,
                date: event.date,
                status: event.status,
                views: event.metrics?.views || 0,
                saves: event.metrics?.saves || 0,
                interested: event.metrics?.interested || 0,
                engagementScore: (event.metrics?.saves || 0) * 2 + (event.metrics?.interested || 0),
            }))
            .sort((a, b) => b.engagementScore - a.engagementScore)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                topPerformingEvents,
                totalEngagement: totalSaves + totalInterested,
                averageViewsPerEvent,
                averageSavesPerEvent,
                averageInterestedPerEvent,
                totalEvents: events.length,
            },
            message: 'Performance metrics retrieved successfully',
        });
    } catch (error) {
        console.error('Get performance metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance metrics',
            error: error.message,
        });
    }
};

// Get follower statistics and growth
export const getFollowerStats = async (req, res) => {
    try {
        const organizerId = req.user._id;

        const followerCount = await User.countDocuments({
            followedOrganizers: organizerId,
        });

        const followers = await User.find({
            followedOrganizers: organizerId,
        })
            .select('name email location.city createdAt')
            .sort('-createdAt')
            .limit(50)
            .lean();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentFollowers = followers.filter(
            (f) => new Date(f.createdAt) >= thirtyDaysAgo
        );

        const followerGrowth = [
            {
                date: thirtyDaysAgo,
                count: followerCount - recentFollowers.length,
            },
            {
                date: new Date(),
                count: followerCount,
            },
        ];

        const followerLocations = followers.reduce((acc, follower) => {
            const city = follower.location?.city || 'Unknown';
            acc[city] = (acc[city] || 0) + 1;
            return acc;
        }, {});

        const locationData = Object.entries(followerLocations)
            .map(([city, count]) => ({ city, count }))
            .sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            data: {
                totalFollowers: followerCount,
                followerGrowth,
                topLocations: locationData.slice(0, 5),
                recentFollowers: followers.slice(0, 10).map((f) => ({
                    name: f.name,
                    city: f.location?.city || 'Unknown',
                    followedAt: f.createdAt,
                })),
            },
            message: 'Follower statistics retrieved successfully',
        });
    } catch (error) {
        console.error('Get follower stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch follower statistics',
            error: error.message,
        });
    }
};