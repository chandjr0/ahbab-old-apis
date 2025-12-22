const mongoose = require("mongoose");

const { Schema } = mongoose;

const stickerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("sticker", stickerSchema);
