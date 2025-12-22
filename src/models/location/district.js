const mongoose = require("mongoose");

const { Schema } = mongoose;

const districtSchema = new Schema(
  {
    divisionId: {
      type: Schema.Types.ObjectId,
      ref: "division",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
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

module.exports = mongoose.model("district", districtSchema);
