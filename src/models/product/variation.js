const mongoose = require("mongoose");

const { Schema } = mongoose;

const variationSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "product",
    },
    barCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attributeOpts: [
      {
        type: Schema.Types.ObjectId,
        ref: "attribute_opt",
        required: true,
      },
    ],
    images: [
      {
        type: String,
        require: true,
      },
    ],
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    regularPrice: {
      type: Number,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
    },
    discount: {
      discountType: {
        type: String,
        enum: ["FLAT", "PERCENT"],
        default: "FLAT",
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    flashPrice: {
      type: Number,
      default: 0,
    },
    purchaseQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPurchasePrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    sellQty: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalSellPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      index: true,
      default: false,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("variation", variationSchema);
