import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: String, // e.g. 'Event', 'User', 'Report', etc.
    targetId: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
export default AdminLog;
