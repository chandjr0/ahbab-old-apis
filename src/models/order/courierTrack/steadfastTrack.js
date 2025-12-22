const mongoose = require("mongoose");

const { Schema } = mongoose;

const steadfastSchema = new Schema(
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
    steadfastKeys: {
      consignment_id: {
        type: Number,
        default: 0,
      },
      invoice: {
        type: String,
        default: "",
      },
      tracking_code: {
        type: String,
        default: "",
      },
      recipient_name: {
        type: String,
        default: "",
      },
      recipient_phone: {
        type: String,
        default: "",
      },
      recipient_address: {
        type: String,
        default: "",
      },
      cod_amount: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        default: "",
      },
      note: {
        type: String,
        default: "",
      },
      // cod charge - delivery charge = the remaining money
      // balance: {
      //   type: Number,
      //   default: 0,
      // },
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("steadfast_track", steadfastSchema);
