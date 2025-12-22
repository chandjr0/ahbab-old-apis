const mongoose = require("mongoose");

const { Schema } = mongoose;

const pathaoCitySchema = new Schema(
  {
    city_id: {
      type: Number,
      index: true,
      required: true,
    },
    city_name: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("pathao_city", pathaoCitySchema);
