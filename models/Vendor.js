const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  companyAddress: { type: String, required: true },
  couponCode: { type: String, required: true },
  referralLink: { type: String, required: true, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  wallet: { type: Number, default: 0 },
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
