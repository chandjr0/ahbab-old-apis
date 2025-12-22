const mongoose = require("mongoose");

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
    subParentId: {
      type: Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
    name: {
      type: String,
      trim: true,
      index: true,
      required: true,
    },
    slug: {
      type: String,
      index: true,
      trim: true,
      unique: true,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredSerial: {
      type: Number,
      default: 0
    },
    imageForCategoryProduct: {
      type: String,
      default: "",
    },
    imageForHomePage: {
      type: String,
      default: "",
    },
    resellerDetails: {
      categoryId: {
        type: Schema.Types.ObjectId,
        ref: "category",
        index: true,
        default: null,
      },
      isCommissionOn: {
        type: Boolean,
        default: false,
      },
      commission: {
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
module.exports = mongoose.model("category", categorySchema);
