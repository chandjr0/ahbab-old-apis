const { model, Schema } = require("mongoose");

const resellerApplicantSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    fbPageUrl: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "hold", "confirm", "reject"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = model("reseller_applicant", resellerApplicantSchema);
