const mongoose = require("mongoose");

const { Schema } = mongoose;

const stockAdjustProductSchema = new Schema(
  {
    stockAdjustId: {
      type: Schema.Types.ObjectId,
      ref: "stock_adjust",
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
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("stock_adjust_product", stockAdjustProductSchema);
