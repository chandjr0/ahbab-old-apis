const mongoose = require("mongoose");

const { Schema } = mongoose;

const pathaoSchema = new Schema(
  {
    orderType: {
      type: String,
      enum: ["admin", "reseller"],
      default: "admin",
    },
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
    orderPayStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      index: true,
      default: "unpaid",
    },
    status: {
      type: String,
      enum: ["running", "complete"],
      default: "running",
    },
    pathaoKeys: {
      consignment_id: {
        type: String,
        default: "",
      },
      merchant_order_id: {
        type: String,
        index: true,
        default: "",
      },
      order_status: {
        type: String,
        index: true,
        required: true,
      },
      store_id: {
        type: Number,
        required: true,
      },
      sender_name: {
        type: String,
        required: true,
      },
      sender_phone: {
        type: String,
        required: true,
      },
      recipient_name: {
        type: String,
        required: true,
      },
      recipient_phone: {
        type: String,
        required: true,
      },
      recipient_address: {
        type: String,
        required: true,
      },
      recipient_city: {
        type: Number,
        required: true,
      },
      recipient_city_name: {
        type: String,
        required: true,
      },
      recipient_zone: {
        type: Number,
        required: true,
      },
      recipient_zone_name: {
        type: String,
        required: true,
      },
      // recipient_area: {
      //   type: Number,
      // },
      // recipient_area_name: {
      //   type: String,
      //   required: true,
      // },
      delivery_type: {
        type: Number,
        required: true,
      },
      item_type: {
        type: Number,
        required: true,
      },
      special_instruction: {
        type: String,
        default: "",
      },
      item_quantity: {
        type: Number,
        default: 1,
      },
      item_weight: {
        type: Number,
        min: 0.5,
        max: 10,
        default: 0.5,
      },
      amount_to_collect: {
        type: Number,
        required: true,
      },
      item_description: {
        type: String,
        default: "",
      },
      reason: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("pathao_service", pathaoSchema);

/*
   
  statuses:[
    "Pickup_Requested"
    "Assigned_for_Pickup"
    "Picked"
    "Pickup_Failed"
    "Pickup_Cancelled"
    "At_the_Sorting_HUB"
    "In_Transit"
    "Received_at_Last_Mile_HUB"
    "Assigned_for_Delivery"
    "Delivered"
    "Partial_Delivery"
    "Return"
    "Delivery_Failed"
    "On_Hold"
    "Payment_Invoice"
  ]

*/
