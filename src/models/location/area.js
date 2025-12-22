const mongoose = require("mongoose");

const { Schema } = mongoose;

const areaSchema = new Schema(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: "district",
      index: true,
      required: true,
    },
    name: {
      type: String,
      index: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["OUTSIDE", "INSIDE"],
      default: "OUTSIDE",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("area", areaSchema);
