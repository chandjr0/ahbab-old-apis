const mongoose = require("mongoose");

const { Schema } = mongoose;

const webhookSchema = new Schema(
  {
    consignment_id: {
      type: String,
      default: "",
    },
    merchant_order_id: {
      type: String,
      default: "",
    },
    order_status: {
      type: String,
      default: "",
    },
    order_status_slug: {
      type: String,
      default: "",
    },
    updated_at: {
      type: String,
      default: "",
    },
    collected_amount: {
      type: Number,
      default: Number,
    },
    reason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("web_hook", webhookSchema);
