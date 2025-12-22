const mongoose = require("mongoose");

const { Schema } = mongoose;

const pathaoZoneSchema = new Schema(
  {
    city_id: {
      type: Number,
      index: true,
      required: true,
    },
    zone_id: {
      type: Number,
      index: true,
      required: true,
    },
    zone_name: {
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

module.exports = mongoose.model("pathao_zone", pathaoZoneSchema);
