const mongoose = require("mongoose");

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderType: {
      type: String,
      index: true,
      default: "admin", // admin, employee, visitor, customer, reseller
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "customers",
      index: true,
      // required: true,
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        isVariant: {
          type: Boolean,
          default: false,
        },
        variationId: {
          type: Schema.Types.ObjectId,
          ref: "variation",
          default: null,
        },
        variationName: {
          type: String,
          default: "",
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        returnQty: {
          type: Number,
          default: 0,
        },
      },
    ],
    serialId: {
      type: String,
      index: true,
      required: true,
    },
    // qrcode: {
    //   type: String,
    // },
    orderStatus: [
      {
        status: {
          type: String,
          index: true,
          enum: [
            "CANCELED",
            "PENDING",
            "HOLD",
            "CONFIRM",
            "PROCESSING",
            "PICKED",
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
    isReturn: {
      type: Boolean,
      default: false,
      index: true,
    },
    // add to all prev database
    returnMoney: {
      type: Number,
      default: 0,
    },
    isRefund: {
      type: Boolean,
      default: false,
      index: true,
    },
    refundMoney: {
      type: Number,
      default: 0,
    },
    courierId: {
      type: Schema.Types.ObjectId,
      ref: "courier",
      index: true,
      default: null,
    },
    liveCourier: {
      type: String,
      enum: ["", "steadfast", "redx"],
      default: "",
    },
    // new
    courierTrackId: {
      type: Schema.Types.ObjectId,
      // ref: "courier_track",
      index: true,
      default: null,
    },
    // new
    courierStatus: {
      type: String,
      default: "",
    },
    //   remove future
    courierName: {
      type: String,
      default: "",
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
    // onlinePaymentReq : means user requested for online payment
    // onlinePaymentError: will contain the error message from the gateway while initiating the payment
    onlinePayment: {
      req: { type: Boolean, default: false },
      url: { type: String, default: "" },
      error: { type: String, default: "" },
      status: { type: String, default: "" },
      failReason: { type: String, default: "" },
    },
    payment: {
      paymentType: {
        type: String, // CASH, NAGAD, BKASH, ROCKET, BANK, aamarPay
        default: "",
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
    paymentHistory: [
      {
        amount: {
          type: Number,
          default: 0,
        },
        time: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    deliveryAddress: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
        index: true,
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
        // default: 0,
        required: true,
      },
      TotalBill: {
        type: Number, //= customerCharge.afterDiscountTotalPrice + customerCharge.deliveryCharge
        default: 0,
      },
      totalPayTk: {
        type: Number,
        default: 0,
        // required: true,
      },
      remainingTkPay: {
        type: Number, //= customerCharge.TotalBill - customerCharge.totalPayTk
        default: 0,
      },
    },
    deliverySiteCost: {
      sentCost: {
        type: Number,
        default: 0,
      },
      returnCost: {
        type: Number,
        default: 0,
      },
      totalCost: {
        type: Number, //= sentCost + returnCost
        default: 0,
      },
    },
    adminRevenue: {
      type: Number, //= customerCharge.totalPayTk - deliverySiteRevenue.totalRevenue
      default: 0,
    },
    updateHistory: [
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
    resellerId: {
      type: Schema.Types.ObjectId,
      ref: "reseller",
      index: true,
      default: null,
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
  },
  {
    timestamps: true,
    index: true,
  }
);

orderSchema.pre("save", async function (done) {
  // customer charge
  this.set(
    "customerCharge.afterDiscountTotalPrice",
    this.customerCharge.totalProductPrice - this.customerCharge.discountPrice
  );

  this.set(
    "customerCharge.TotalBill",
    this.customerCharge.afterDiscountTotalPrice + this.customerCharge.deliveryCharge
  );

  this.set(
    "customerCharge.remainingTkPay",
    this.customerCharge.TotalBill - this.customerCharge.totalPayTk
  );

  // deliver site cost
  this.set(
    "deliverySiteCost.totalCost",
    this.deliverySiteCost.sentCost + this.deliverySiteCost.returnCost
  );

  // admin revenue
  this.set("adminRevenue", this.customerCharge.totalPayTk - this.deliverySiteCost.totalCost);

  done();
});

module.exports = mongoose.model("order", orderSchema);

/*
customerCharge: {
  totalProductPrice: Number//
  discountPrice: Number//
  afterDiscountTotalPrice: Number         //= totalProductPrice + discountPrice

  deliveryCharge: Number//
  TotalBill: Number                       //= afterDiscountTotalPrice + deliveryCharge

  totalPayTk: Number// 
  remainingTkPay: Number                  //= TotalBill - totalPayTk
}

deliverySiteRevenue: {
  sendCost: Number,//
  returnCost: Number,//
  totalRevenue: Number                    //= sendRevenue + returnRevenue
}

adminRevenue: Number                   //= customerCharge.totalPayTk - deliverySiteRevenue.totalRevenue
*/
