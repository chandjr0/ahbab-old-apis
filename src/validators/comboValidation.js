const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createCombo = {
  body: Joi.object().keys({
    name: Joi.string().min(2).max(120).required(),
    regularPrice: Joi.number().required().allow(0),
    sellingPrice: Joi.number().required().allow(0),
    comboProducts: Joi.array().items(
      Joi.object().keys({
        productId: Joi.objectId().required(),
        price: Joi.number().required().allow(0),
      })
    ),
    description: Joi.string().required().allow(""),
    guideline: Joi.string().required().allow(""),
    galleryImage: Joi.array().items(Joi.string()).required(),
    videoUrl: Joi.string().required().allow(""),
    resellerDetails: Joi.object().keys({
      isCommissionOn: Joi.boolean().required(),
      commission: Joi.number().required().allow(0),
    }),
    isReseller: Joi.boolean().required(),
    isFeatured: Joi.boolean().required(),
    isOwnDisabled: Joi.boolean().required(),
    isPosSuggest: Joi.boolean().required(),
  }),
};

const updateCombo = {
  body: Joi.object().keys({
    name: Joi.string().min(2).max(120).required(),
    regularPrice: Joi.number().required().allow(0),
    sellingPrice: Joi.number().required().allow(0),
    comboProducts: Joi.array().items(
      Joi.object().keys({
        productId: Joi.objectId().required(),
        price: Joi.number().required().allow(0),
      })
    ),
    description: Joi.string().required().allow(""),
    guideline: Joi.string().required().allow(""),
    galleryImage: Joi.array().items(Joi.string()).required(),
    videoUrl: Joi.string().required().allow(""),
    resellerDetails: Joi.object().keys({
      isCommissionOn: Joi.boolean().required(),
      commission: Joi.number().required().allow(0),
    }),
    isReseller: Joi.boolean().required(),
    isFeatured: Joi.boolean().required(),
    isOwnDisabled: Joi.boolean().required(),
    isPosSuggest: Joi.boolean().required(),
  }),
  params: Joi.object().keys({
    comboId: Joi.objectId().required(),
  }),
};

const listOFCombo = {
  body: Joi.object().keys({
    value: Joi.string().required().allow(""),
    comboType: Joi.string()
      .required()
      .valid("", "FEATURED", "NON_FEATURED", "TOP_POS", "PUBLISH", "UNPUBLISH", "FLASH"),
    sort: Joi.string().required().valid("", "NEW_TO_OLD", "OLD_TO_NEW", "LH_SELL", "HL_SELL"),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const posListOFCombo = {
  body: Joi.object().keys({
    value: Joi.string().required().allow(""),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const featuredCombo = {
  body: Joi.object().keys({
    isFeatured: Joi.boolean().required(),
  }),
  params: Joi.object().keys({
    comboId: Joi.objectId().required(),
  }),
};

const posSuggestedCombo = {
  body: Joi.object().keys({
    isPosSuggest: Joi.boolean().required(),
  }),
  params: Joi.object().keys({
    comboId: Joi.objectId().required(),
  }),
};

const disableCombo = {
  body: Joi.object().keys({
    isOwnDisabled: Joi.boolean().required(),
  }),
  params: Joi.object().keys({
    comboId: Joi.objectId().required(),
  }),
};

const resellerStatusCombo = {
  body: Joi.object().keys({
    isReseller: Joi.boolean().required(),
  }),
  params: Joi.object().keys({
    comboId: Joi.objectId().required(),
  }),
};

const pagination = {
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

module.exports = {
  createCombo,
  updateCombo,
  listOFCombo,
  posListOFCombo,
  featuredCombo,
  posSuggestedCombo,
  disableCombo,
  resellerStatusCombo,
  pagination,
};
