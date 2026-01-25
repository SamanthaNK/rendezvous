import User from '../models/userModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';

// Follow organizer
export const followOrganizer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { organizerId } = req.params;

    // Prevent self-follow
    if (userId.toString() === organizerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    // Check if organizer exists and is actually an organizer
    const organizer = await User.findById(organizerId).select('role').lean();
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizer.role !== 'organizer' && organizer.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is not an organizer',
      });
    }

    // Check current user
    const user = await User.findById(userId).select('followedOrganizers').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already following (convert to strings for comparison)
    const isFollowing = user.followedOrganizers.some(
      (id) => id.toString() === organizerId
    );

    if (isFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Already following this organizer',
      });
    }

    // Atomic operations to prevent race conditions
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $addToSet: { followedOrganizers: organizerId },
      }),
      OrganizerProfile.findOneAndUpdate(
        { user: organizerId },
        { $inc: { 'metrics.followerCount': 1 } },
        { upsert: true } // Create profile if doesn't exist
      ),
    ]);

    res.json({
      success: true,
      message: 'Organizer followed successfully',
    });
  } catch (error) {
    console.error('Follow organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to follow organizer',
      error: error.message,
    });
  }
};

// Unfollow organizer
export const unfollowOrganizer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { organizerId } = req.params;

    const user = await User.findById(userId).select('followedOrganizers').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if currently following
    const isFollowing = user.followedOrganizers.some(
      (id) => id.toString() === organizerId
    );

    if (!isFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Not following this organizer',
      });
    }

    // Atomic operations
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $pull: { followedOrganizers: organizerId },
      }),
      OrganizerProfile.findOneAndUpdate(
        { user: organizerId },
        { $inc: { 'metrics.followerCount': -1 } }
      ),
    ]);

    res.json({
      success: true,
      message: 'Organizer unfollowed successfully',
    });
  } catch (error) {
    console.error('Unfollow organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unfollow organizer',
      error: error.message,
    });
  }
};

// Get followed organizers
export const getFollowedOrganizers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const user = await User.findById(userId)
      .select('followedOrganizers')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const organizers = await User.find({
      _id: { $in: user.followedOrganizers },
    })
      .select('name email profilePicture role')
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const organizerIds = organizers.map((o) => o._id);
    const profiles = await OrganizerProfile.find({
      user: { $in: organizerIds },
    })
      .select('user isVerified verificationBadge metrics.averageRating metrics.totalEvents')
      .lean();

    // Merge profiles with organizers
    const profileMap = {};
    profiles.forEach((profile) => {
      profileMap[profile.user.toString()] = profile;
    });

    const enrichedOrganizers = organizers.map((organizer) => {
      const profile = profileMap[organizer._id.toString()];
      return {
        ...organizer,
        isVerified: profile?.isVerified || false,
        verificationBadge: profile?.verificationBadge || 'none',
        averageRating: profile?.metrics?.averageRating || 0,
        totalEvents: profile?.metrics?.totalEvents || 0,
      };
    });

    const total = user.followedOrganizers.length;

    res.json({
      success: true,
      data: {
        organizers: enrichedOrganizers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrganizers: total,
        },
      },
    });
  } catch (error) {
    console.error('Get followed organizers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followed organizers',
      error: error.message,
    });
  }
};