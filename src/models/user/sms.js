const mongoose = require("mongoose");

const { Schema } = mongoose;

const smsSchema = new Schema(
  {
    phone: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("sms", smsSchema);
