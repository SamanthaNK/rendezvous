import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';
import Report from '../models/reportModel.js';
import VerificationRequest from '../models/verificationRequestModel.js';
import AdminLog from '../models/adminLogModel.js';

export const getDashboard = async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const registeredUsers = await User.countDocuments({ isEmailVerified: true });
    const organizers = await User.countDocuments({ role: 'organizer' });

    // Event stats
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: 'published' });
    const pastEvents = await Event.countDocuments({ status: 'past' });
    const upcomingEvents = await Event.countDocuments({ date: { $gt: new Date() }, status: 'published' });
    const draftEvents = await Event.countDocuments({ status: 'draft' });

    // Events by category
    const eventsByCategoryAgg = await Event.aggregate([
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
    ]);
    const eventsByCategory = eventsByCategoryAgg.map((c) => ({ category: c._id, count: c.count }));

    // Trending events (most viewed/saved)
    const trendingEvents = await Event.find({ status: 'published' })
      .sort({ 'metrics.views': -1, 'metrics.saves': -1 })
      .limit(5)
      .select('title metrics.views metrics.saves');

    // User engagement metrics (DAU, MAU)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const DAU = await User.countDocuments({ lastLogin: { $gte: oneDayAgo } });
    const MAU = await User.countDocuments({ lastLogin: { $gte: oneMonthAgo } });

    // Log admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'view_dashboard',
      targetType: null,
      targetId: null,
      details: {},
    });
    res.json({
      totalUsers,
      registeredUsers,
      organizers,
      totalEvents,
      activeEvents,
      pastEvents,
      upcomingEvents,
      draftEvents,
      eventsByCategory,
      trendingEvents,
      engagement: { DAU, MAU },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getFlaggedEvents = async (req, res) => {
  try {
    const flaggedEvents = await Event.find({ 'flags.0': { $exists: true } });
    await AdminLog.create({
      admin: req.user._id,
      action: 'view_flagged_events',
      targetType: null,
      targetId: null,
      details: {},
    });
    res.json({ flaggedEvents });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const moderateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: approve/reject/remove
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (action === 'approve') {
      event.status = 'published';
    } else if (action === 'reject') {
      event.status = 'rejected';
      event.rejectionReason = reason;
    } else if (action === 'remove') {
      event.status = 'removed';
      event.removalReason = reason;
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
    await event.save();
    await AdminLog.create({
      admin: req.user._id,
      action: `event_${action}`,
      targetType: 'Event',
      targetId: id,
      details: { reason },
    });
    res.json({ message: `Event ${action}d` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('reportedBy reportedUser event');
    await AdminLog.create({
      admin: req.user._id,
      action: 'view_reports',
      targetType: null,
      targetId: null,
      details: {},
    });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.status = 'resolved';
    report.resolvedAt = new Date();
    await report.save();
    await AdminLog.create({
      admin: req.user._id,
      action: 'resolve_report',
      targetType: 'Report',
      targetId: id,
      details: {},
    });
    res.json({ message: 'Report resolved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getVerificationRequests = async (req, res) => {
  try {
    const requests = await VerificationRequest.find({ status: 'pending' }).populate('organizer');
    await AdminLog.create({
      admin: req.user._id,
      action: 'view_verification_requests',
      targetType: null,
      targetId: null,
      details: {},
    });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await VerificationRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = 'approved';
    request.reviewedAt = new Date();
    await request.save();
    // Optionally update organizer profile
    await OrganizerProfile.findByIdAndUpdate(request.organizer, { isVerified: true });
    await AdminLog.create({
      admin: req.user._id,
      action: 'approve_verification',
      targetType: 'VerificationRequest',
      targetId: id,
      details: {},
    });
    res.json({ message: 'Verification approved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await VerificationRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = 'rejected';
    request.reviewedAt = new Date();
    await request.save();
    await AdminLog.create({
      admin: req.user._id,
      action: 'reject_verification',
      targetType: 'VerificationRequest',
      targetId: id,
      details: {},
    });
    res.json({ message: 'Verification rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = false;
    await user.save();
    await AdminLog.create({
      admin: req.user._id,
      action: 'ban_user',
      targetType: 'User',
      targetId: id,
      details: {},
    });
    res.json({ message: 'User banned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = true;
    await user.save();
    await AdminLog.create({
      admin: req.user._id,
      action: 'unban_user',
      targetType: 'User',
      targetId: id,
      details: {},
    });
    res.json({ message: 'User unbanned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
