const mongoose = require("mongoose");

const { Schema } = mongoose;

const adminsSchema = new Schema(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("admins", adminsSchema);
