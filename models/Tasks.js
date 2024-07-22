const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['social', 'advertisement'],
    required: true
  },
  usersAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);




/*const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: String,
  taskName: String,
  description: String,
  link: String,
  type: String,
  userCount: Number,
  usersAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  userIds: [mongoose.Schema.Types.ObjectId],
  expiresAt: Date
});

module.exports = mongoose.model('Task', taskSchema);
*/