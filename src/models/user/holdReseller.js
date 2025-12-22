const mongoose = require("mongoose");

const { Schema } = mongoose;

const holdResellerSchema = new Schema(
  {
    otpCode: {
      type: String,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      index: true,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("hold_reseller", holdResellerSchema);
