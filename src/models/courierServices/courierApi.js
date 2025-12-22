const mongoose = require("mongoose");

const { Schema } = mongoose;

const courierApiSchema = new Schema(
  {
    steadfast: {
      steadfastId: {
        type: Schema.Types.ObjectId
      },
      STEADFAST_CLIENT_ID: {
        type: String,
        default: "",
      },
      STEADFAST_API_KEY: {
        type: String,
        default: "",
      },
      STEADFAST_SK: {
        type: String,
        default: "",
      },
    },
    pathao: {
      pathaoId: {
        type: Schema.Types.ObjectId
      },
      PATHAO_BASE: {
        type: String,
        default: "",
      },
      PATHAO_CLIENT_ID: {
        type: String,
        default: "",
      },
      PATHAO_CLIENT_SECRET: {
        type: String,
        default: "",
      },
      PATHAO_USERNAME: {
        type: String,
        default: "",
      },
      PATHAO_PASSWORD: {
        type: String,
        default: "",
      },
      PATHAO_GRANT_TYPE: {
        type: String,
        default: "",
      },
      PATHAO_SENDER_NAME: {
        type: String,
        default: "",
      },
      PATHAO_SENDER_PHONE: {
        type: String,
        default: "",
      },
      PATHAO_WEBHOOK_KEY: {
        type: String,
        default: "",
      },
      accessToken: {
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

module.exports = mongoose.model("courier_api", courierApiSchema);
