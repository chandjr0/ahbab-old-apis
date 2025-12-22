const mongoose = require("mongoose");

const { Schema } = mongoose;

const holdAdminSchema = new Schema(
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
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("hold_admin", holdAdminSchema);
