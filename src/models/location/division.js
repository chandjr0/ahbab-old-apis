const mongoose = require("mongoose");

const { Schema } = mongoose;

const divisionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);
module.exports = mongoose.model("division", divisionSchema);
