const mongoose = require("mongoose");

const { Schema } = mongoose;

const resellerPaymentSchema = new Schema(
  {
    serialId: {
      type: String,
      required: true,
      index: true,
    },
    resellerId: {
      type: Schema.Types.ObjectId,
      ref: "reseller",
      required: true,
    },
    orderIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "order",
        required: true,
      },
    ],
    paymentInfo: {
      totalProfitMoney: {
        type: Number,
        default: 0,
      },
      totalAdvanceMoney: {
        type: Number,
        default: 0,
      },
      totalGrandProfit: {
        type: Number,
        default: 0, // totalProfitMoney - totalAdvanceMoney
      },
    },
    details: {
      type: String,
      default: "",
    },
    files: [
      {
        type: String,
        default: "",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "confirm", "cancel"],
      default: "pending",
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
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

module.exports = mongoose.model("reseller_payment", resellerPaymentSchema);
