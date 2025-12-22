const mongoose = require("mongoose");

const { Schema } = mongoose;

const resellerOrderComboProductSchema = new Schema(
  {
    orderComboId: {
      type: Schema.Types.ObjectId,
      ref: "reseller_order_combo",
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "reseller_order",
      required: true,
      index: true,
    },
    comboId: {
      type: Schema.Types.ObjectId,
      ref: "combo",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "product",
      default: null,
      index: true,
    },
    isVariant: {
      type: Boolean,
      default: false,
    },
    variationId: {
      type: Schema.Types.ObjectId,
      ref: "variation",
      default: null,
    },
    variationName: {
      type: String,
      default: "",
    },
    quantity: {
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

module.exports = mongoose.model("reseller_order_combo_product", resellerOrderComboProductSchema);
