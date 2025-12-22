const mongoose = require("mongoose");

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "order",
      index: true,
      required: true,
    },
    courierId: {
      type: Schema.Types.ObjectId,
      ref: "order",
      index: true,
      required: true,
    },
    trackId: {
      type: String,
      index: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "employee",
      index: true,
      default: null,
    },
    createdBy: {
      type: String,
      index: true,
      default: "admin",
    },
    status: {
      type: String,
      enum: ["running", "complete", "cancel"],
      default: "running",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("courier_track", orderSchema);
