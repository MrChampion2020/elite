const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  username: { type: String, unique: true },
  companyName: String,
  couponCode: String,
  companyAddress: String,
  referralLink: { type: String, unique: true },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  wallet: {type: String, default: 0},
  active: { type: Boolean, default: false }, // Add the active field
  referralLinkActive: { type: Boolean, default: true },
  accountType: { type: String, default: 'naira' },
  bankAccount: {
    accountNumber: String,
    bankName: String,
    accountHolderName: String,
  },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Vendor', VendorSchema);
