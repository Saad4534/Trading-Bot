const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
  _id:  { type: String, default: "config" },
  totalTradingAmount: { type: Number, required: true },
  perScriptTradingAmount: {type: Number, required: true},
  is_amo: { type: Boolean, required: true },
  product: { type: String, required: true },
  order_type: { type: String, required: true },
  transactionType: { type: String, required: true },
  validity: { type: String, required: true },
  instrumentKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, {versionKey: false});

const Configuration = mongoose.model('Configuration', configurationSchema);

module.exports = Configuration;
