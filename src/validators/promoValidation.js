const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const create = {
  body: Joi.object().keys({
    promo: Joi.string().required(),
    promoType: Joi.string()
      .required()
      .valid("regular", "free_delivery", "product", "combo", "category", "phone"),
    minBuyingAmount: Joi.number().required(),
    productIds: Joi.array().items(Joi.objectId()),
    comboIds: Joi.array().items(Joi.objectId()),
    categoryIds: Joi.array().items(Joi.objectId()),
    phones: Joi.array().items(
      Joi.string()
        .length(11)
        .regex(/^01\d{9}$/)
    ),
    discount: Joi.object().keys({
      discountType: Joi.string().required().valid("PERCENT", "FLAT"),
      discountPrice: Joi.number().required(),
    }),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    limitInfo: Joi.object().keys({
      haveLimit: Joi.boolean().required(),
      maxUsed: Joi.number()
        .required()
        .when("haveLimit", {
          is: false,
          then: Joi.valid(0),
          otherwise: Joi.number().positive(),
        }),
    }),
    userLimitInfo: Joi.object().keys({
      haveLimit: Joi.boolean().required(),
      maxUsed: Joi.number()
        .required()
        .when("haveLimit", {
          is: false,
          then: Joi.valid(0),
          otherwise: Joi.number().positive(),
        }),
    }),
    isDisable: Joi.boolean().required(),
  }),
};

const update = {
  body: Joi.object().keys({
    minBuyingAmount: Joi.number().required(),
    discount: Joi.object().keys({
      discountType: Joi.string().required().valid("PERCENT", "FLAT"),
      discountPrice: Joi.number().required(),
    }),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    limitInfo: Joi.object().keys({
      haveLimit: Joi.boolean().required(),
      maxUsed: Joi.number()
        .required()
        .when("haveLimit", {
          is: false,
          then: Joi.valid(0),
          otherwise: Joi.number().positive(),
        }),
    }),
    userLimitInfo: Joi.object().keys({
      haveLimit: Joi.boolean().required(),
      maxUsed: Joi.number()
        .required()
        .when("haveLimit", {
          is: false,
          then: Joi.valid(0),
          otherwise: Joi.number().positive(),
        }),
    }),
    isDisable: Joi.boolean().required(),
  }),
  params: {
    promoId: Joi.objectId().required(),
  },
};

const fetchAllPromo = {
  query: Joi.object().keys({
    promoType: Joi.string()
      .required()
      .valid("all", "regular", "free_delivery", "product", "combo", "category", "phone"),
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const enableOrDisable = {
  params: {
    promoId: Joi.objectId().required(),
  },
  query: Joi.object().keys({
    isDisable: Joi.boolean().required(),
  }),
};

const checkPromoId = {
  params: {
    promoId: Joi.objectId().required(),
  },
};

const verifyPromo = {
  body: Joi.object().keys({
    promo: Joi.string().required(),
    products: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean(),
          variationId: Joi.alternatives().conditional("isVariant", {
            is: true,
            then: Joi.objectId(),
            otherwise: Joi.string().valid(""),
          }),
          variationName: Joi.string().allow(""),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      )
      .required(),
    combos: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          comboId: Joi.objectId().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
          uid: Joi.string(),
          products: Joi.array()
            .min(1)
            .items(
              Joi.object().keys({
                productId: Joi.objectId(),
                isVariant: Joi.boolean(),
                variationId: Joi.alternatives().conditional("isVariant", {
                  is: true,
                  then: Joi.objectId(),
                  otherwise: Joi.string().valid(""),
                }),
                variationName: Joi.string().allow(""),
              })
            ),
        })
      )
      .required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/)
      .required()
      .allow(""),
  }),
};

module.exports = {
  create,
  update,
  fetchAllPromo,
  enableOrDisable,
  checkPromoId,
  verifyPromo,
};
