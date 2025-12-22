const mongoose = require("mongoose");

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      index: true,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    shortDescription: {
      type: String,
      default: "",
    },
    guideline: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      index: true,
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    barCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "category",
        required: true,
      },
    ],
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "brand",
    },
    stickerId: {
      type: Schema.Types.ObjectId,
      ref: "sticker",
    },
    unit: {
      type: String,
      default: "",
    },
    weight: {
      type: Number,
      min: 10,
      max: 10000,
      default: 10,
    },
    galleryImage: [
      {
        type: String,
      },
    ],
    videoUrl: {
      type: String,
      default: "",
    },
    chartTitle: {
      type: String,
      default: "",
    },
    chartList: {
      type: [[String]],
      default: [[""]],
    },
    isVariant: {
      type: Boolean,
      default: false,
    },
    variations: [
      {
        type: Schema.Types.ObjectId,
        ref: "variation",
      },
    ],
    nonVariation: {
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
      },
      totalPurchasePrice: {
        type: Number,
        default: 0,
      },
      sellQty: {
        type: Number,
        default: 0,
      },
      totalSellPrice: {
        type: Number,
        default: 0,
      },
    },
    stockAlert: {
      type: Number,
      min: 0,
      default: 5,
    },
    totalStock: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalSell: {
      type: Number,
      min: 0,
      default: 0,
    },
    comboSell: {
      type: Number,
      min: 0,
      default: 0,
    },
    tags: [String],
    resellerDetails: {
      categoryId: {
        type: Schema.Types.ObjectId,
        ref: "category",
        default: null,
      },
      isCommissionOn: {
        type: Boolean,
        default: false,
      },
      commission: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    isReseller: {
      type: Boolean,
      index: true,
      default: false,
    },
    isFlashDeal: {
      type: Boolean,
      index: true,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      index: true,
      default: false,
    },
    isPosSuggest: {
      type: Boolean,
      default: false,
    },
    isFreeDelivery: {
      type: Boolean,
      index: true,
      default: false,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    isOwnDisabled: {
      type: Boolean,
      index: true,
      default: false,
    },
    isActive: {
      type: Boolean,
      index: true,
      default: true,
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

module.exports = mongoose.model("product", productSchema);
