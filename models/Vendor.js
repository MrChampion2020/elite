const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  username: String,
  companyName: String,
  couponCode: String,
  companyAddress: String,
  referralLink: String,
  referredBy: String,
  wallet: {type: String, default: 0},
  active: { type: Boolean, default: false } // Add the active field
});

module.exports = mongoose.model('Vendor', VendorSchema);
