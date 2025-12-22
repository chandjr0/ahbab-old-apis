const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const updateFlashDeal = {
  body: Joi.object().keys({
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    flashDealProducts: Joi.array()
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          flashPrice: Joi.number().required(),
          isVariant: Joi.boolean().required(),
          variations: Joi.array().items(
            Joi.object().keys({
              variationId: Joi.objectId().required(),
              flashPrice: Joi.number().required(),
            })
          ),
        })
      )
      .required(),
  }),
};

module.exports = {
  updateFlashDeal,
};
