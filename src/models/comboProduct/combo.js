const mongoose = require("mongoose");

const { Schema } = mongoose;

const comboSchema = new Schema(
  {
    name: { type: String, required: true },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        sku: {
          type: String,
          default: "",
        },
      },
    ],
    regularPrice: {
      type: Number,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
    },
    totalSell: {
      type: Number,
      default: 0,
    },
    description: { type: String, default: "" },
    guideline: { type: String, default: "" },
    slug: { type: String, index: true, required: true },
    sku: { type: String, required: true, index: true },
    galleryImage: [{ type: String }],
    videoUrl: { type: String, default: "" },
    isReseller: {
      type: Boolean,
      index: true,
      default: false,
    },
    resellerDetails: {
      isCommissionOn: { type: Boolean, default: false },
      commission: { type: Number, min: 0, default: 0 },
    },
    isFeatured: { type: Boolean, index: true, default: false },
    isPosSuggest: { type: Boolean, default: false },
    isOwnDisabled: { type: Boolean, index: true, default: false },
    isDeleted: { type: Boolean, index: true, default: false },
  },
  { timestamps: true, index: true }
);

module.exports = mongoose.model("combo", comboSchema);
