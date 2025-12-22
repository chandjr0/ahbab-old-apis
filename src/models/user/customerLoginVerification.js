const mongoose = require("mongoose");

const { Schema } = mongoose;

const customerLoginVerificationSchema = new Schema(
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
    }
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("customer_login_verification", customerLoginVerificationSchema);