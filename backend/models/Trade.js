const { Schema, model } = require('mongoose');

const tradeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    shares: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = model('Trade', tradeSchema);
