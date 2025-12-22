const mongoose = require("mongoose");

const { Schema } = mongoose;

const brandSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      index: true,
      required: true,
    },
    slug: {
      type: String,
      index: true,
      trim: true,
      unique: true,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("brand", brandSchema);
