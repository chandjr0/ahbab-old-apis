const mongoose = require("mongoose");

const { Schema } = mongoose;

const purchaseProductsSchema = new Schema(
  {
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: "purchase",
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
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    isReceived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("purchase_prod", purchaseProductsSchema);
