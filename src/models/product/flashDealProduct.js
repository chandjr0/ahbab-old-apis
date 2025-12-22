const mongoose = require("mongoose");

const { Schema } = mongoose;

const flashDealSchema = new Schema(
  {
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
    ],
    startTime: {
      type: Date,
      default: Date.now(),
    },
    endTime: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("flash_deal", flashDealSchema);
