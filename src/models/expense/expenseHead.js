const mongoose = require("mongoose");

const { Schema } = mongoose;

const expenseHeadSchema = new Schema(
  {
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

module.exports = mongoose.model("expense_head", expenseHeadSchema);
