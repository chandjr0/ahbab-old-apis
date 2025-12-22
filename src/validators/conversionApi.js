const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const adminFbEventsSDK = {
  body: Joi.object().keys({
    eventType: Joi.string()
      .required()
      .valid("ViewContent", "Purchase", "InitiateCheckout", "AddToCart"),
    fbClickId: Joi.string().required().allow(""),
    userIpAddress: Joi.string().required().allow(""),
    userAgent: Joi.string().required().allow(""),
    host: Joi.string().required().allow(""),
    products: Joi.array()
      .min(1)
      .items(
        Joi.object().keys({
          name: Joi.string().required(),
          category: Joi.string().allow(""),
          sku: Joi.string().required().allow(""),
          slug: Joi.string().required().allow(""),
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variation: Joi.object().allow(null),
          variationId: Joi.string().allow(null),
          // variationName: Joi.string().required().allow(""),
          image: Joi.array().items(),
          stock: Joi.number().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      ),
    totalProductPrice: Joi.number().allow(0),
    deliveryAddress: Joi.object().keys({
      name: Joi.string().allow(""),
      phone: Joi.string().allow(""),
      city: Joi.string().allow(""),
      zone: Joi.string().allow(""),
      address: Joi.string().allow(""),
    }),
  }),
};

module.exports = {
  adminFbEventsSDK,
};
