const { Schema, model } = require('mongoose');

const holdingSchema = new Schema(
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
    shares: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

holdingSchema.index({ user: 1, ticker: 1 }, { unique: true });

holdingSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = model('Holding', holdingSchema);
