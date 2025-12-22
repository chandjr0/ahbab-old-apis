const mongoose = require("mongoose");

const { Schema } = mongoose;

const holdUserSchema = new Schema(
  {
    resellerId: {
      type: Schema.Types.ObjectId,
      index: true,
      default: null,
    },
    otpCode: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: "",
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

module.exports = mongoose.model("hold_user", holdUserSchema);
