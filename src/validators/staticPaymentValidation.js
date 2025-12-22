const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createStaticPayment = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    image: Joi.string().trim().allow("").required(),
    description: Joi.string().trim().allow("").required(),
    isDisabled: Joi.boolean().required(),
  }),
};

const updateStaticPayment = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    image: Joi.string().trim().allow("").required(),
    description: Joi.string().trim().allow("").required(),
    isDisabled: Joi.boolean().required(),
  }),
};

module.exports = {
  createStaticPayment,
  updateStaticPayment,
};
