const mongoose = require("mongoose");

const { Schema } = mongoose;

const resellerOrderComboSchema = new Schema(
  {
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

module.exports = mongoose.model("reseller_order_combo", resellerOrderComboSchema);
