const mongoose = require("mongoose");

const { Schema } = mongoose;

const adminOrderComboSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "admin_order",
      required: true,
      index: true,
    },
    comboId: {
      type: Schema.Types.ObjectId,
      ref: "combo",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    returnQty: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("admin_order_combo", adminOrderComboSchema);
