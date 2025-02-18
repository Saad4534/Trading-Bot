const mongoose = require('mongoose');

const SelectedSymbolSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  symbol: { type: String, required: true },
  open: Number,
  high: Number,
  low: Number,
  high_interval: Number,
  low_interval: Number,
  ltp: Number,
});

module.exports = mongoose.model('SelectedSymbol', SelectedSymbolSchema);
