const mongoose = require("mongoose");

const { Schema } = mongoose;

const promoSchema = new Schema(
  {
    promo: {
      type: String,
      trim: true,
      required: true,
    },
    promoType: {
      type: String,
      enum: ["regular", "free_delivery", "product", "combo", "category", "phone"],
      default: "regular",
    },
    productIds: [{ type: Schema.Types.ObjectId, ref: "product", required: true }],
    comboIds: [{ type: Schema.Types.ObjectId, ref: "combo", required: true }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "category", required: true }],
    phones: [{ type: String, required: true }],
    minBuyingAmount: { type: Number, required: true },
    discount: {
      discountType: {
        type: String,
        enum: ["", "PERCENT", "FLAT"],
        default: "FLAT",
      },
      discountPrice: {
        type: Number,
        default: 0,
      },
    },
    // total limit
    limitInfo: {
      haveLimit: { type: Boolean, default: false },
      maxUsed: {
        type: Number,
        default: 0,
      },
      totalUsed: { type: Number, default: 0 },
    },
    // single user limit
    userLimitInfo: {
      haveLimit: { type: Boolean, default: false },
      maxUsed: {
        type: Number,
        default: 0,
      },
    },
    startTime: { type: Date, required: true },
    endTime: {
      type: Date,
      required: true,
    },
    isDisable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("promo", promoSchema);
