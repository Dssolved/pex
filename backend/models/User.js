const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    walletBalance: {
      type: Number,
      required: true,
      default: 10000,
      min: 0,
    },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = model('User', userSchema);
