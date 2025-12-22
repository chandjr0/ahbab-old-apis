const mongoose = require("mongoose");

const { Schema } = mongoose;

const stockAdjustSchema = new Schema(
  {
    serialId: {
      type: String,
      index: true,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    document: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "admin", // admin, employee
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("stock_adjust", stockAdjustSchema);
