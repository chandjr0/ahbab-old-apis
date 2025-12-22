const mongoose = require("mongoose");

const { Schema } = mongoose;

const incompleteOrderSchema = new Schema(
  {
    visitorId: {
      type: String,
      required: true,
    },
    sequenceNumber: {
      type: String,
      required: true,
    },
    orderStatus: [
      {
        status: {
          type: String,
          index: true,
          enum: [
            "CANCELED",
            "PENDING",
            "HOLD",
            "INVOICED",
            "CONFIRM",
            // "PROCESSING",
            // "PICKED",
            "SHIPPED",
            "DELIVERED",
            "RETURNED",
            "REFUND",
          ],
        },
        time: {
          type: Date,
          default: Date.now(),
        },
        changeBy: {
          type: String,
          default: "admin",
        },
        employeeId: {
          type: Schema.Types.ObjectId,
          ref: "employee",
          index: true,
          default: null,
        },
      },
    ],
    totalQty: {
      type: Number,
      default: 0,
    },
    orderCancelationNotes: {
      notes: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      },
      phone: {
        type: String,
        default: ''
      },
      time: {
        type: Date,
        default: Date.now(),
      },
    },
    deliveryAddress: {
      name: {
        type: String,
        default: '',
      },
      phone: {
        type: String,
        required: true,
        index: true,
      },
      cityId: {
        type: Schema.Types.ObjectId,
        ref: "pathao_city",
        default: null,
      },
      address: {
        type: String,
        default: "",
      },
    },
    customerCharge: {
      totalProductPrice: {
        type: Number,
        required: true,
      },
      discountPrice: {
        type: Number,
        required: true,
      },
      afterDiscountTotalPrice: {
        type: Number, //= customerCharge.totalProductPrice - customerCharge.discountPrice
        default: 0,
      },
      deliveryCharge: {
        type: Number,
        default: 0,
      },
      totalBill: {
        type: Number, //= customerCharge.afterDiscountTotalPrice + customerCharge.deliveryCharge
        default: 0,
        index: true,
      },
      totalPayTk: {
        type: Number,
        default: 0,
      },
      remainingTkPay: {
        type: Number, //= customerCharge.totalBill - customerCharge.totalPayTk
        default: 0,
      },
    },
    status: {
      type: String,
      default: "PENDING",
    },
    bodyData: {
      type: Object,
      default: {},
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("admin_order_incomplete", incompleteOrderSchema); 
