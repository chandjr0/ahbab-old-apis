const mongoose = require("mongoose");

const { Schema } = mongoose;

const comboProductSchema = new Schema(
  {
    comboId: {
      type: Schema.Types.ObjectId,
      ref: "combo",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, index: true }
);

module.exports = mongoose.model("combo_product", comboProductSchema);
