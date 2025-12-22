const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createRedxParcel = {
  body: Joi.object().keys({
    orderId: Joi.objectId().required(),
    courierId: Joi.objectId().required(),
    courierName: Joi.string().required(),
    customerName: Joi.string().allow("").required(),
    customerPhone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    customerAddress: Joi.string().allow("").required(),
    deliveryArea: Joi.string().allow("").required(),
    deliveryAreaId: Joi.number().allow(0).required(),
    merchantInvoiceId: Joi.string().allow("").required(),
    cashCollectionAmount: Joi.string().allow("").required(),
    parcelWeight: Joi.number().allow(0).required(),
    instruction: Joi.string().allow("").required(),
    value: Joi.number().allow(0).required(),
    parcelDetailsJson: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().allow(""),
          category: Joi.string().allow(""),
          value: Joi.number().allow(""),
        })
      )
      .required(),
  }),
};

const createSteadfastParcel = {
  body: Joi.object().keys({
    orderId: Joi.objectId().required(),
    courierId: Joi.objectId().required(),
    courierName: Joi.string().required(),
    customerName: Joi.string().allow("").required(),
    customerPhone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    customerAddress: Joi.string().allow("").required(),
    merchantInvoiceId: Joi.string().allow("").required(),
    cashCollectionAmount: Joi.number().allow(0).required(),
    instruction: Joi.string().allow("").required(),
  }),
};

module.exports = {
  createRedxParcel,
  createSteadfastParcel,
};
