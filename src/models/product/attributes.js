const mongoose = require("mongoose");

const { Schema } = mongoose;

const attributeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    options: [
      {
        type: Schema.Types.ObjectId,
        ref: "attribute_opt",
        required: true,
      },
    ],
    isDisabled: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("attribute", attributeSchema);
