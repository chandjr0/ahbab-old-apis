const mongoose = require("mongoose");

const { Schema } = mongoose;

const adminOrderProductIncompleteSchema = new Schema(
  {
    visitorId: {
      type: String,
      default: '',
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "admin_order",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "product",
      required: true,
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
    price: {
      type: Number,
      required: true,
    },
    returnQty: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("admin_order_product_incomplete", adminOrderProductIncompleteSchema);
