const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createSupplier = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    phone: Joi.string().required(),
    image: Joi.string().trim().allow("").required(),
    address: Joi.string().trim().allow("").required(),
    isDisabled: Joi.boolean().required(),
  }),
};

const updateSupplier = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    phone: Joi.string().required(),
    image: Joi.string().trim().allow("").required(),
    address: Joi.string().trim().allow("").required(),
    isDisabled: Joi.boolean().required(),
  }),
};

module.exports = {
  createSupplier,
  updateSupplier,
};
