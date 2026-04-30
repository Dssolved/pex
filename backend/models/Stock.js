const { Schema, model } = require('mongoose');

const stockSchema = new Schema(
  {
    ticker: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 8,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

stockSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = model('Stock', stockSchema);
