const mongoose = require("mongoose");

const { Schema } = mongoose;

const pathaoAreaSchema = new Schema(
  {
    zone_id: {
      type: Number,
      index: true,
      required: true,
    },
    area_id: {
      type: Number,
      index: true,
      required: true,
    },
    area_name: {
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

module.exports = mongoose.model("pathao_area", pathaoAreaSchema);
