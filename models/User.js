
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: mongoose.Schema.Types.ObjectId,
  taskName: String,
  description: String,
  link: String,
  type: String,
  assignedAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  wallet: { type: Number, default: 0 },
  fullName: String,
  username: { type: String, unique: true, required: true },
  phone: String,
  couponCode: String,
  packageOption: String,
  verificationToken: String,
  isVerified: { type: Boolean, default: false },
  referralWallet: { type: Number, default: 3000 },
  eliteWallet: { type: Number, default: 0 },
  selectedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  completedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  referralLink: { type: String, unique: true },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  role: { type: String, enum: ['user', 'admin', 'vendor'], default: 'user' },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralLinkActive: { type: Boolean, default: true },
  accountType: { type: String, default: 'naira' },
  bankAccount: {
    accountNumber: String,
    bankName: String,
    accountHolderName: String,
  },
  tasks: [taskSchema],
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending',
  },
  lastLogin: { type: Date, default: null },
  lastSpin: { type: Date, default: null }
}, { timestamps: true });

UserSchema.pre('save', function(next) {
  if (!this.referralLink && this.username) {
    this.referralLink = `https://elitearn.com/register?ref=${this.username}`;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);




/*const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  wallet: { type: Number, default: 0 },
  fullName: String,
  username: { type: String, unique: true },
  phone: String,
  couponCode: String,
  packageOption: String,
  verificationToken: { type: String },
  isVerified: { type: Boolean, default: false },
  referralWallet: { type: Number, default: 3000 },
  eliteWallet: { type: Number, default: 0 },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  selectedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  completedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  referralLink: { type: String, unique: true },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  role: { type: String, enum: ['user', 'admin', 'vendor'], default: 'user' },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralLinkActive: { type: Boolean, default: true },
  accountType: { type: String, default: 'naira' },
  bankAccount: {
    accountNumber: String,
    bankName: String,
    accountHolderName: String,
  },
  tasks: [
    {
      taskId: mongoose.Schema.Types.ObjectId,
      taskName: String,
      description: String,
      link: String,
      type: String,
      assignedAt: { type: Date, default: Date.now },
    },
  ],
  lastLogin: { type: Date, default: null },
  lastSpin: { type: Date, default: null }

}, { timestamps: true });

UserSchema.pre('save', function(next) {
  if (!this.referralLink) {
    this.referralLink = `https://elitearn.com/register?ref=${this.username}`;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
*/