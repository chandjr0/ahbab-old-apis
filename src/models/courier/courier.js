const mongoose = require("mongoose");

const { Schema } = mongoose;

const courierSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("courier", courierSchema);
