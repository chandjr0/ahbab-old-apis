const mongoose = require("mongoose");

const { Schema } = mongoose;

const pathaoZoneSchema = new Schema(
  {
    store_id: {
      type: Number,
      index: true,
      required: true,
    },
    store_name: {
      type: String,
      required: true,
    },
    store_address: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("pathao_store", pathaoZoneSchema);
