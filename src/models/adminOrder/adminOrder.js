const mongoose = require("mongoose");

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    serialId: {
      type: String,
      index: true,
      required: true,
    },
    barCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "customers",
      index: true,
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
            // "REFUND",
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
    orderPayStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      index: true,
      default: "unpaid",
    },
    returnDetails: {
      isDone: {
        type: Boolean,
        default: false,
      },
      returnMoney: {
        type: Number,
        default: 0,
      },
    },
    // isReturn: {
    //   type: Boolean,
    //   default: false,
    //   index: true,
    // },
    // returnMoney: {
    //   type: Number,
    //   default: 0,
    // },
    // isRefund: {
    //   type: Boolean,
    //   default: false,
    //   index: true,
    // },
    // refundMoney: {
    //   type: Number,
    //   default: 0,
    // },
    duplicateNumber: {
      type: Number,
      default: 0,
    },
    totalWeight: {
      type: String,
      required: "0.5",
    },
    totalQty: {
      type: Number,
      default: 0,
    },
    courierInfo: {
      consignmentId: { 
        type: String,
        default: null
      },
      clientId: {
        type: String,
        default: ''
      },
      courierId: {
        type: Schema.Types.ObjectId,
        ref: "courier",
        index: true,
        default: null,
      },
      liveCourier: {
        type: String,
        enum: ["", "steadfast", "redx", "pathao"],
        default: "",
      },
      courierTrackId: {
        type: Schema.Types.ObjectId,
        index: true,
        default: null,
      },
      trackId: {
        type: String,
        default: "",
      },
      courierStatus: {
        type: String,
        default: "",
      },
      time: {
        type: Date,
        default: null,
      },
    },
    adminNote: [
      {
        message: {
          type: String,
          required: true,
        },
        createdBy: {
          type: String,
          default: "admin",
        },
        time: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    customerNote: {
      type: String,
      default: "",
    },
    onlinePayment: {},
    payment: {
      paymentType: {
        type: String, // COD, NAGAD, BKASH, ROCKET, BANK
        default: "Cash",
      },
      amount: {
        type: Number,
        default: 0,
      },
      details: {
        type: String, // card, phone, digit number
        default: "",
      },
      documentImg: {
        type: String,
        default: "",
      },
    },
    deliveryAddress: {
      name: {
        type: String,
        required: true,
        index: true,
      },
      phone: {
        type: String,
        required: true,
        index: true,
      },
      cityId: {
        type: Schema.Types.ObjectId,
        ref: "pathao_city",
        required: true,
        index: true,
      },
      zoneId: {
        type: Schema.Types.ObjectId,
        ref: "pathao_zone",
        required: true,
      },
      areaId: {
        type: Schema.Types.ObjectId,
        ref: "pathao_area",
        default: null,
      },
      address: {
        type: String,
        default: "",
        index: true,
      },
    },
    deliveryType: {
      type: String,
      enum: ["inside", "outside"],
      default: "inside",
    },
    promoCode: {
      type: String,
      default: "",
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
    createdBy: {
      type: String,
      default: "admin", // admin, employee, customer
    },
    employeeId: {
      type: Schema.Types.ObjectId, // create order by this employee
      ref: "employee",
      index: true,
      default: null,
    },
    assignEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: "employee",
      index: true,
      default: null,
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("admin_order", orderSchema);
