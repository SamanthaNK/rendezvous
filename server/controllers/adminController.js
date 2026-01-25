import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';
import Report from '../models/reportModel.js';
import VerificationRequest from '../models/verificationRequestModel.js';
import AdminLog from '../models/adminLogModel.js';

// Get dashboard analytics
export const getDashboard = async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const registeredUsers = await User.countDocuments({ isEmailVerified: true });
    const organizers = await User.countDocuments({
      role: { $in: ['organizer', 'admin'] },
    });
    const verifiedOrganizers = await OrganizerProfile.countDocuments({
      isVerified: true,
    });

    // Event stats
    const totalEvents = await Event.countDocuments({ isDraft: false });
    const activeEvents = await Event.countDocuments({
      status: 'published',
      isDraft: false,
    });
    const pastEvents = await Event.countDocuments({ status: 'past' });
    const upcomingEvents = await Event.countDocuments({
      date: { $gte: new Date() },
      status: 'published',
      isDraft: false,
    });
    const draftEvents = await Event.countDocuments({ isDraft: true });
    const flaggedEvents = await Event.countDocuments({ isFlagged: true });

    // Events by category
    const eventsByCategoryAgg = await Event.aggregate([
      { $match: { isDraft: false } },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const eventsByCategory = eventsByCategoryAgg.map((item) => ({
      category: item._id,
      count: item.count,
    }));

    // Trending events
    const trendingEvents = await Event.find({
      status: 'published',
      isDraft: false,
    })
      .select('title metrics.views metrics.saves metrics.interested categories')
      .sort({ 'metrics.views': -1, 'metrics.saves': -1 })
      .limit(10)
      .lean();

    // User engagement metrics
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyActiveUsers = await User.countDocuments({
      lastLogin: { $gte: oneDayAgo },
    });
    const monthlyActiveUsers = await User.countDocuments({
      lastLogin: { $gte: oneMonthAgo },
    });

    // Pending moderation items
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const pendingVerifications = await VerificationRequest.countDocuments({
      status: 'pending',
    });

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'view_dashboard',
      targetType: null,
      targetId: null,
      details: { timestamp: new Date() },
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          registered: registeredUsers,
          organizers,
          verifiedOrganizers,
        },
        events: {
          total: totalEvents,
          active: activeEvents,
          past: pastEvents,
          upcoming: upcomingEvents,
          draft: draftEvents,
          flagged: flaggedEvents,
        },
        eventsByCategory,
        trendingEvents,
        engagement: {
          dailyActiveUsers,
          monthlyActiveUsers,
        },
        pendingModeration: {
          reports: pendingReports,
          verifications: pendingVerifications,
        },
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

// Get flagged events
export const getFlaggedEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'flagConfidenceScore' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const flaggedEvents = await Event.find({ isFlagged: true })
      .select('title description organizer flagReason flagConfidenceScore createdAt categories')
      .populate('organizer', 'name email')
      .sort({ [sortBy]: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Event.countDocuments({ isFlagged: true });

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'view_flagged_events',
      targetType: 'Event',
      targetId: null,
      details: { page, total },
    });

    res.json({
      success: true,
      data: {
        events: flaggedEvents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalEvents: total,
        },
      },
      message: 'Flagged events retrieved successfully',
    });
  } catch (error) {
    console.error('Get flagged events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flagged events',
      error: error.message,
    });
  }
};

// Moderate event
export const moderateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    // Validate action
    const validActions = ['approve', 'keep-flagged', 'remove'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be: approve, keep-flagged, or remove',
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Update event based on action
    if (action === 'approve') {
      event.isFlagged = false;
      event.flagReason = null;
      event.flagConfidenceScore = 0;
      event.status = 'published';
    } else if (action === 'keep-flagged') {
      // Keeps flagged but don't remove
      event.isFlagged = true;
    } else if (action === 'remove') {
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Reason is required when removing an event',
        });
      }
      // Doesn't actually delete, just change status
      event.status = 'cancelled';
      event.cancellationReason = reason;
      event.isFlagged = false;
    }

    await event.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: `moderate_event_${action}`,
      targetType: 'Event',
      targetId: id,
      details: { action, reason, eventTitle: event.title },
    });

    res.json({
      success: true,
      message: `Event ${action === 'approve' ? 'approved' : action === 'keep-flagged' ? 'kept flagged' : 'removed'} successfully`,
    });
  } catch (error) {
    console.error('Moderate event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate event',
      error: error.message,
    });
  }
};

// Get reports
export const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filters = {};
    if (status !== 'all') {
      filters.status = status;
    }

    const reports = await Report.find(filters)
      .populate('reportedBy', 'name email')
      .populate('event', 'title organizer')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Report.countDocuments(filters);

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'view_reports',
      targetType: 'Report',
      targetId: null,
      details: { page, status, total },
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReports: total,
        },
      },
      message: 'Reports retrieved successfully',
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message,
    });
  }
};

// Resolve report
export const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (report.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Report already resolved',
      });
    }

    report.status = 'resolved';
    report.resolvedAt = new Date();
    report.resolution = resolution || 'Resolved by admin';
    await report.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'resolve_report',
      targetType: 'Report',
      targetId: id,
      details: { resolution },
    });

    res.json({
      success: true,
      message: 'Report resolved successfully',
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve report',
      error: error.message,
    });
  }
};

// Get verification requests
export const getVerificationRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filters = { status };

    const requests = await VerificationRequest.find(filters)
      .populate('organizer', 'name email')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await VerificationRequest.countDocuments(filters);

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'view_verification_requests',
      targetType: 'VerificationRequest',
      targetId: null,
      details: { page, status, total },
    });

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRequests: total,
        },
      },
      message: 'Verification requests retrieved successfully',
    });
  } catch (error) {
    console.error('Get verification requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification requests',
      error: error.message,
    });
  }
};

// Approve verification
export const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { badge = 'verified' } = req.body;

    const request = await VerificationRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Verification request already processed',
      });
    }

    // Update request
    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    // Update organizer profile
    await OrganizerProfile.findOneAndUpdate(
      { user: request.organizer },
      {
        isVerified: true,
        verifiedAt: new Date(),
        verificationBadge: badge,
      },
      { upsert: true }
    );

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'approve_verification',
      targetType: 'VerificationRequest',
      targetId: id,
      details: { organizerId: request.organizer, badge },
    });

    res.json({
      success: true,
      message: 'Verification approved successfully',
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve verification',
      error: error.message,
    });
  }
};

// Reject verification
export const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, suggestions } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const request = await VerificationRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Verification request already processed',
      });
    }

    // Update request
    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    request.rejectionReason = reason;
    request.improvementSuggestions = suggestions || '';
    await request.save();

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'reject_verification',
      targetType: 'VerificationRequest',
      targetId: id,
      details: { organizerId: request.organizer, reason },
    });

    res.json({
      success: true,
      message: 'Verification request rejected',
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject verification',
      error: error.message,
    });
  }
};

// Ban user
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, isPermanent = true } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Ban reason is required',
      });
    }

    const user = await User.findById(id).select('role name').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent banning other admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot ban admin users',
      });
    }

    // Update user
    await User.findByIdAndUpdate(id, {
      isActive: false,
    });

    // If organizer, update profile
    if (user.role === 'organizer') {
      await OrganizerProfile.findOneAndUpdate(
        { user: id },
        {
          accountStatus: 'banned',
          'banInfo.reason': reason,
          'banInfo.bannedAt': new Date(),
          'banInfo.bannedBy': req.user._id,
          'banInfo.isPermanent': isPermanent,
        }
      );
    }

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'ban_user',
      targetType: 'User',
      targetId: id,
      details: { reason, userName: user.name, isPermanent },
    });

    res.json({
      success: true,
      message: 'User banned successfully',
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ban user',
      error: error.message,
    });
  }
};

// Unban user
export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('role name').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user
    await User.findByIdAndUpdate(id, {
      isActive: true,
    });

    // If organizer, update profile
    if (user.role === 'organizer') {
      await OrganizerProfile.findOneAndUpdate(
        { user: id },
        {
          accountStatus: 'active',
          banInfo: {
            reason: null,
            bannedAt: null,
            bannedBy: null,
            isPermanent: false,
          },
        }
      );
    }

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'unban_user',
      targetType: 'User',
      targetId: id,
      details: { userName: user.name },
    });

    res.json({
      success: true,
      message: 'User unbanned successfully',
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unban user',
      error: error.message,
    });
  }
};