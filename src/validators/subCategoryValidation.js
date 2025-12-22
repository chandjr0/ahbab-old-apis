const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createSubCategory = {
  body: Joi.object().keys({
    categoryId: Joi.objectId().required(),
    name: Joi.string().trim().required(),
    image: Joi.string().trim().allow("").required(),
    isFeatured: Joi.boolean().required(),
  }),
};

const updateSubCategory = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    image: Joi.string().trim().allow("").required(),
    attributes: Joi.array().items(Joi.string().trim().required()).required(),
    brands: Joi.array().items(Joi.string().trim().required()).required(),
    isFeatured: Joi.boolean().required(),
    isDisabled: Joi.boolean().required(),
  }),
};

module.exports = {
  createSubCategory,
  updateSubCategory,
};
