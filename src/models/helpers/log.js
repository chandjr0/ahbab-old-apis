const mongoose = require("mongoose");

const { Schema } = mongoose;

const logSchema = new Schema(
  {
    referObjectId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    time: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("log", logSchema);
