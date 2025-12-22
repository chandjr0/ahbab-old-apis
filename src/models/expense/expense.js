const mongoose = require("mongoose");

const { Schema } = mongoose;

const expenseSchema = new Schema(
  {
    createDate: {
      type: Date,
      default: Date.now(),
    },
    expenseType: {
      type: String,
      default: "",
    },
    paymentType: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      default: 0,
    },
    details: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("expense", expenseSchema);
