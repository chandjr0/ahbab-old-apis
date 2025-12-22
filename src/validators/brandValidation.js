const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createBrand = {
  body: Joi.object().keys({
    // subCategoryId: Joi.objectId().required().required(),
    name: Joi.string().trim().required(),
    image: Joi.string().trim().allow("").required(),
    isFeatured: Joi.boolean().required(),
    isDisabled: Joi.boolean().required(),
  }),
};

const updateBrand = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    image: Joi.string().trim().allow("").required(),
    isFeatured: Joi.boolean().required(),
    isDisabled: Joi.boolean().required(),
  }),
};

module.exports = {
  createBrand,
  updateBrand,
};
