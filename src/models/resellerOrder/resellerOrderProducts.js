const mongoose = require("mongoose");

const { Schema } = mongoose;

const resellerOrderProductSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "reseller_order",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "product",
      required: true,
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
    price: {
      type: Number,
      required: true,
    },
    returnQty: {
      type: Number,
      default: 0,
    },
    resellerInfo: {
      isResellerBaseCommission: {
        type: Boolean,
        default: true,
      },
      commission: {
        type: Number,
        default: 0,
      },
      profitMoney: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("reseller_order_product", resellerOrderProductSchema);
