const mongoose = require("mongoose");

const { Schema } = mongoose;

const customersSchema = new Schema(
  {
    // new addition start
    resellerId: {
      type: Schema.Types.ObjectId,
      index: true,
      default: null,
    },
    // new addition end
    userName: {
      type: String,
      trim: true,
      index: true,
      // unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      index: true,
    },
    email: {
      type: String,
      default: "",
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: "",
    },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "pathao_city",
      default: null,
    },
    zoneId: {
      type: Schema.Types.ObjectId,
      ref: "pathao_zone",
      default: null,
    },
    areaId: {
      type: Schema.Types.ObjectId,
      ref: "pathao_area",
      required: null,
    },
    address: {
      type: String,
      default: "",
    },
    wishList: [
      {
        type: Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "customer",
    },
    createdBy: {
      type: String,
      enum: ["admin", "employee", "self"],
      default: "self",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("customer", customersSchema);
