const mongoose = require("mongoose");

const { Schema } = mongoose;

const supplierSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("supplier", supplierSchema);
