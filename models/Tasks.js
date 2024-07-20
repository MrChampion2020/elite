
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: String,
  taskName: String,
  description: String,
  link: String,
  type: String,
  userCount: Number,
  usersAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  userIds: [mongoose.Schema.Types.ObjectId],
  expiresAt: Date
});

module.exports = mongoose.model('Task', taskSchema);
