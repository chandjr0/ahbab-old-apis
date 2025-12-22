const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createAttribute = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    isDisabled: Joi.boolean().required(),
  }),
};

const updateAttribute = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    isDisabled: Joi.boolean().required(),
  }),
};

const createAttributeOpt = {
  body: Joi.object().keys({
    attributeId: Joi.objectId().required(),
    name: Joi.string().trim().required(),
  }),
};

const updateAttributeOpt = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
  }),
};

module.exports = {
  createAttribute,
  updateAttribute,
  createAttributeOpt,
  updateAttributeOpt,
};
