const mongoose = require("mongoose");

const { Schema } = mongoose;

const adminOrderVerificationSchema = new Schema(
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

module.exports = mongoose.model("admin_order_verification", adminOrderVerificationSchema);