const mongoose = require('mongoose');

const instrumentSchema = new mongoose.Schema({
  last_price: { type: Number },
  quantity: { type: Number },
  symbol_key: { type: String },
  transaction_type: {type: String},
  instrument_token: { type: String },
  trigger_price: { type: Number },
  trading_amount: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

const Instrument = mongoose.model('Instrument', instrumentSchema);

module.exports = Instrument;
