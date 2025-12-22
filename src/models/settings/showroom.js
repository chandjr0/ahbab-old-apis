const mongoose = require("mongoose");

const { Schema } = mongoose;

const showroomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    phones: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("showroom", showroomSchema);
