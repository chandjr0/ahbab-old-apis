const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createStockAdjust = {
  body: Joi.object().keys({
    note: Joi.string().allow(""),
    document: Joi.string().allow(""),
    products: Joi.array()
      .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variationId: Joi.objectId().required().allow(null),
          variationName: Joi.string().required().allow(""),
          quantity: Joi.number().required(),
          // price: Joi.number().required(),
        })
      ),
  }),
};

const fetchAllStockAdjust = {
  body: Joi.object().keys({
    startTime: Joi.date().required().allow(""),
    endTime: Joi.date().required().allow(""),
  }),
};

module.exports = {
  createStockAdjust,
  fetchAllStockAdjust,
};
