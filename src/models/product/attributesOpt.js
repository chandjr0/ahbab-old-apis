const mongoose = require("mongoose");

const { Schema } = mongoose;

const attributeOptSchema = new Schema(
  {
    attributeId: {
      type: Schema.Types.ObjectId,
      ref: "attribute",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("attribute_opt", attributeOptSchema);
