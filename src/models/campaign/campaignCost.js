const mongoose = require("mongoose");

const { Schema } = mongoose;

const campaignCostSchema = new Schema(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "campaign",
      required: true,
    },
    usdCost: {
      type: Number,
      default: 0,
    },
    dollarRate: {
      type: Number,
      default: 0,
    },
    bdtCost: {
      type: Number,
      default: 0,
    },
    payTime: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("campaign_cost", campaignCostSchema);
