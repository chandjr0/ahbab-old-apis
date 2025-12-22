const { model, Schema } = require("mongoose");

const resellerSchema = new Schema(
  {
    serialId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    apiKey: {
      type: String,
      index: true,
      default: "",
    },
    referId: {
      type: String,
      default: "",
    },
    commission: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    phone: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    fbId: {
      type: String,
      default: "",
    },
    fbPageName: {
      type: String,
      default: "",
    },
    whatsAppNo: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    logoImg: {
      type: String,
      default: "",
    },
    generalSettingPhone: {
      type: String,
      default: "",
    },
    nid: {
      number: {
        type: String,
        default: "",
      },
      nidImage: {
        type: String,
        default: "",
      },
    },
    address: {
      present: {
        type: String,
        default: "",
      },
      permanent: {
        type: String,
        default: "",
      },
      office: {
        type: String,
        default: "",
      },
    },
    legalDocs: [
      {
        type: String,
        required: true,
      },
    ],
    website: {
      domain: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "hold", "active", "inactive"],
      default: "pending",
    },
    paymentDetails: {
      payTo: {
        type: String,
        enum: ["", "bkash", "nagad", "rocket", "bank"],
        default: "",
      },
      bkash: {
        type: String,
        default: "",
      },
      nagad: {
        type: String,
        default: "",
      },
      rocket: {
        type: String,
        default: "",
      },
      bank: {
        bankName: {
          type: String,
          default: "",
        },
        branchName: {
          type: String,
          default: "",
        },
        accName: {
          type: String,
          default: "",
        },
        accNumber: {
          type: String,
          default: "",
        },
        routingNumber: {
          type: String,
          default: "",
        },
      },
    },
    createdBy: {
      type: String,
      enum: ["admin", "employee", "self"],
      default: "self",
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "employee",
      index: true,
      default: null,
    },
    role: {
      type: String,
      default: "reseller",
    },
  },
  { timestamps: true }
);

module.exports = model("reseller", resellerSchema);
