const mongoose = require("mongoose");

const { Schema } = mongoose;

const purchaseSchema = new Schema(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "supplier",
      default: null,
      index: true,
    },
    serialId: {
      type: String,
      index: true,
      required: true,
    },
    totalBill: {
      type: Number,
      default: 0,
    },
    purchaseStatus: [
      {
        status: {
          type: String,
          enum: ["CANCELED", "PENDING", "RECEIVED"],
          index: true,
        },
        time: {
          type: Date,
          default: Date.now(),
          index: true,
        },
        changeBy: {
          type: String,
          default: "admin",
          index: true,
        },
      },
    ],
    adminNote: [
      {
        message: {
          type: String,
          required: true,
        },
        createdBy: {
          type: String,
          default: "admin", // admin, employee
        },
        time: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
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

module.exports = mongoose.model("purchase", purchaseSchema);
