const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const courierServiceUpdate = {
  body: Joi.object().keys({
    steadfast: Joi.object().keys({
      steadfastId: Joi.objectId().allow(null),
      STEADFAST_CLIENT_ID: Joi.string().required().allow(''),
      STEADFAST_API_KEY: Joi.string().required().allow(""),
      STEADFAST_SK: Joi.string().required().allow(""),
    }),
    pathao: Joi.object().keys({
      pathaoId: Joi.objectId().allow(null),
      PATHAO_BASE: Joi.string().required().allow(""),
      PATHAO_CLIENT_ID: Joi.string().required().allow(""),
      PATHAO_CLIENT_SECRET: Joi.string().required().allow(""),
      PATHAO_USERNAME: Joi.string().required().allow(""),
      PATHAO_PASSWORD: Joi.string().required().allow(""),
      PATHAO_GRANT_TYPE: Joi.string().required().allow(""),
      PATHAO_SENDER_NAME: Joi.string().required().allow(""),
      PATHAO_SENDER_PHONE: Joi.string().required().allow(""),
      PATHAO_WEBHOOK_KEY: Joi.string().required().allow(""),
    }),
  }),
};

const createPathaoParcel = {
  body: Joi.object().keys({
    orderType: Joi.string().required().valid("admin", "reseller"),
    orderSerialId: Joi.string().required(),
    customerName: Joi.string().required(),
    customerPhone: Joi.string().required(),
    customerAddress: Joi.string().min(10).required(),
    store_id: Joi.number().required(),
    city_id: Joi.number().required(),
    zone_id: Joi.number().required(),
    area_id: Joi.number().required(),
    totalQuantity: Joi.number().required(),
    weight: Joi.number().min(0.5).max(10).required(),
    collectionMoney: Joi.number().required(),
    instruction: Joi.string().required().allow(""),
    description: Joi.string().required().allow(""),
  }),
};

const createPathaoBulkParcel = {
  body: Joi.object().keys({
    orderType: Joi.string().required().valid("admin", "reseller"),
    store_id: Joi.number().required(),
    orderIds: Joi.array().min(1).items(Joi.objectId().required()),
  }),
};

// const updateStatusByWebhook = {
//   body: Joi.object().keys({
//     consignment_id: Joi.string().required(),
//     merchant_order_id: Joi.string().required(),
//     order_status: Joi.string().required(),
//     order_status_slug: Joi.string().required(),
//     updated_at: Joi.string().required(),
//     collected_amount: Joi.number().allow(0), // partial payment
//     invoice_id: Joi.string(), // payment invoice
//     reason: Joi.string(), // payment invoice
//   }),
// };

module.exports = {
  courierServiceUpdate,
  createPathaoParcel,
  createPathaoBulkParcel,
  // updateStatusByWebhook,
};
