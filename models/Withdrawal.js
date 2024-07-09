const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  bankName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  accountNumber: { type: Number, required: true },
  amount: { type: Number, required: true },
  walletType: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);
