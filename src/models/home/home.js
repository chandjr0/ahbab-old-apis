// models index
const mongoose = require("mongoose");

const { Schema } = mongoose;

const homeSchema = new Schema(
  {
    resellerId: {
      type: Schema.Types.ObjectId,
      ref: "reseller",
      index: true,
      default: null,
    },
    deviceType: {
      type: String,
      enum: ["web", "mobile"],
      index: true,
    },
    flashProduct: {
      type: "Boolean",
      default: true,
    },
    featureProducts: {
      type: "Boolean",
      default: true,
    },
    bestProducts: {
      type: "Boolean",
      default: true,
    },
    comboProducts: {
      type: "Boolean",
      default: true,
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "category",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
    index: true,
  }
);
module.exports = mongoose.model("home", homeSchema);
