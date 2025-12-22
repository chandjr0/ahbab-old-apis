// models index
const mongoose = require("mongoose");

const { Schema } = mongoose;

const employeesSchema = new Schema(
  {
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
    orderStatusUpdate: {
      type: Boolean,
      default: false,
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
      default: "employee",
    },
  },
  {
    timestamps: true,
    index: true,
  }
);

module.exports = mongoose.model("employee", employeesSchema);
