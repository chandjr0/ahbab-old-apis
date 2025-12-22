const mongoose = require("mongoose");

const { Schema } = mongoose;

const campaignSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
    ],
    startDate: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("campaign", campaignSchema);
