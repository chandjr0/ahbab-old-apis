const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createCategory = {
  body: Joi.object().keys({
    parentId: Joi.objectId().allow(""),
    subParentId: Joi.objectId().allow(""),
    name: Joi.string().trim().required(),
    image: Joi.string().trim().allow("").required(),
    imageForCategoryProduct: Joi.string().trim().allow("").required(),
    imageForHomePage: Joi.string().trim().allow("").required(),
    isFeatured: Joi.boolean().required(),
    featuredSerial: Joi.number()
  }),
};

const updateCategory = {
  body: Joi.object().keys({
    parentId: Joi.objectId().allow(""),
    subParentId: Joi.objectId().allow(""),
    name: Joi.string().trim().required(),
    image: Joi.string().trim().allow("").required(),
    imageForCategoryProduct: Joi.string().trim().allow("").required(),
    imageForHomePage: Joi.string().trim().allow("").required(),
    isFeatured: Joi.boolean().required(),
    featuredSerial: Joi.number()
  }),
};

const addCategoryProductCommissions = {
  body: Joi.object().keys({
    categoryId: Joi.objectId().allow(""),
    commission: Joi.number().required(),
  }),
};

module.exports = {
  createCategory,
  updateCategory,
  addCategoryProductCommissions,
};
