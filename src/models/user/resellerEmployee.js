// models index
const mongoose = require("mongoose");

const { Schema } = mongoose;

const employeesSchema = new Schema(
  {
    resellerId: { type: Schema.Types.ObjectId, ref: "reseller", required: true },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    phone: {
      type: String,
      index: true,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      required: true,
    },
    menuList: [
      {
        name: String,
        subMenuList: [String],
      },
    ],
    password: {
      type: String,
      trim: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "reseller_emp",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("reseller_employee", employeesSchema);
