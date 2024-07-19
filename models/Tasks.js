const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  taskName: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String, required: true },
  type: { type: String, required: true }, // 'social' or 'advertisement'
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now, expires: '24h' }
});

module.exports = mongoose.model('Task', taskSchema);