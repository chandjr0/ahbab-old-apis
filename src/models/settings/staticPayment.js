// models index
const mongoose = require("mongoose");

const { Schema } = mongoose;

const staticPaymentSchema = new Schema(
  {
    resellerId: {
      type: Schema.Types.ObjectId,
      ref: "reseller",
      index: true,
      default: null,
    },
    name: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    isDisabled: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);
module.exports = mongoose.model("static_payment", staticPaymentSchema);
