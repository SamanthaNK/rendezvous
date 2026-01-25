import User from '../models/userModel.js';
import OrganizerProfile from '../models/organizerProfileModel.js';

// POST /users/follow/:organizerId
export const followOrganizer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { organizerId } = req.params;

    if (userId.toString() === organizerId) {
      return res.status(400).json({ message: "You can't follow yourself." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.followedOrganizers.includes(organizerId)) {
      return res.status(400).json({ message: 'Already following this organizer.' });
    }

    user.followedOrganizers.push(organizerId);
    await user.save();

    // Update follower count
    await OrganizerProfile.findOneAndUpdate(
      { user: organizerId },
      { $inc: { 'metrics.followerCount': 1 } }
    );

    res.status(200).json({ message: 'Organizer followed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /users/follow/:organizerId
export const unfollowOrganizer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { organizerId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.followedOrganizers.includes(organizerId)) {
      return res.status(400).json({ message: 'Not following this organizer.' });
    }

    user.followedOrganizers = user.followedOrganizers.filter(
      (id) => id.toString() !== organizerId
    );
    await user.save();

    // Update follower count
    await OrganizerProfile.findOneAndUpdate(
      { user: organizerId },
      { $inc: { 'metrics.followerCount': -1 } }
    );

    res.status(200).json({ message: 'Organizer unfollowed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /users/followed-organizers
export const getFollowedOrganizers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: 'followedOrganizers',
      select: 'name email profilePicture',
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ organizers: user.followedOrganizers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
