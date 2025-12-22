const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

// admin crud
const createProduct = {
  body: Joi.object().keys({
    name: Joi.string().min(2).max(120).required(),
    description: Joi.string().required().allow(""),
    shortDescription: Joi.string().allow("", null),
    guideline: Joi.string().required().allow(""),
    categories: Joi.array().items(Joi.objectId()),
    brandId: Joi.objectId().required().allow(""),
    stickerId: Joi.objectId().required().allow(""),
    unit: Joi.string().required().allow(""),
    weight: Joi.number().min(10).max(10000).required(),
    galleryImage: Joi.array().items(Joi.string()).required(),
    videoUrl: Joi.string().required().allow(""),
    chartTitle: Joi.string().required().allow(""),
    chartList: Joi.array().items(Joi.array().items()),
    tags: Joi.array().items(Joi.string()).optional(),
    isVariant: Joi.boolean().required(),
    variations: Joi.array().items(
      Joi.object().keys({
        attributeOpts: Joi.array().min(1).items(Joi.objectId()),
        images: Joi.array().items(Joi.string()).required(),
        regularPrice: Joi.number().required().allow(0),
        discount: Joi.object().keys({
          discountType: Joi.string().required().valid("FLAT", "PERCENT"),
          amount: Joi.number().required().allow(0),
        }),
      })
    ),
    nonVariation: Joi.object().keys({
      regularPrice: Joi.number().required().allow(0),
      discount: Joi.object().keys({
        discountType: Joi.string().required().valid("FLAT", "PERCENT"),
        amount: Joi.number().required().allow(0),
      }),
    }),
    stockAlert: Joi.number().required().allow(0),
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

const updateProduct = {
  body: Joi.object().keys({
    name: Joi.string().min(2).max(120).required(),
    description: Joi.string().required().allow(""),
    shortDescription: Joi.string().allow("", null),
    guideline: Joi.string().required().allow(""),
    categories: Joi.array().items(Joi.objectId()),
    brandId: Joi.objectId().required().allow(""),
    stickerId: Joi.objectId().required().allow(""),
    unit: Joi.string().required().allow(""),
    weight: Joi.number().min(10).max(10000).required(),
    galleryImage: Joi.array().items(Joi.string()).required(),
    videoUrl: Joi.string().required().allow(""),
    chartTitle: Joi.string().required().allow(""),
    chartList: Joi.array().items(Joi.array().items()),
    tags: Joi.array().items(Joi.string()).optional(),
    isVariant: Joi.boolean().required(),
    variations: Joi.array().items(
      Joi.object().keys({
        attributeOpts: Joi.array().min(1).items(Joi.objectId()),
        images: Joi.array().items(Joi.string()).required(),
        regularPrice: Joi.number().required().allow(0),
        discount: Joi.object().keys({
          discountType: Joi.string().required().valid("FLAT", "PERCENT"),
          amount: Joi.number().required().allow(0),
        }),
      })
    ),
    oldVariations: Joi.array().items(
      Joi.object().keys({
        _id: Joi.objectId(),
        images: Joi.array().items(Joi.string()).required(),
        regularPrice: Joi.number().required().allow(0),
        discount: Joi.object().keys({
          discountType: Joi.string().required().valid("FLAT", "PERCENT"),
          amount: Joi.number().required().allow(0),
        }),
      })
    ),
    nonVariation: Joi.object().keys({
      regularPrice: Joi.number().required().allow(0),
      discount: Joi.object().keys({
        discountType: Joi.string().required().valid("FLAT", "PERCENT"),
        amount: Joi.number().required().allow(0),
      }),
    }),
    stockAlert: Joi.number().required().allow(0),
    resellerDetails: Joi.object().keys({
      isCommissionOn: Joi.boolean().required(),
      commission: Joi.number().required().allow(0),
    }),
    isReseller: Joi.boolean().required(),
    isFeatured: Joi.boolean().required(),
    isOwnDisabled: Joi.boolean().required(),
    isPosSuggest: Joi.boolean().required(),
  }),
  params: {
    productId: Joi.objectId().required(),
  },
};

const updateProductStock = {
  body: Joi.object().keys({
    isVariant: Joi.boolean().required(),
    nonVariationStock: Joi.number().required().allow(0),
    variations: Joi.array().items(
      Joi.object().keys({
        variantId: Joi.objectId(),
        stock: Joi.number().required().allow(0),
      })
    ),
  }),
  params: {
    productId: Joi.objectId().required(),
  },
};

const productId = {
  params: {
    productId: Joi.objectId().required(),
  },
};

const fetchAllProductsByAdmin = {
  body: Joi.object().keys({
    categorySlug: Joi.string().required().allow(""),
    prodType: Joi.string()
      .required()
      .valid("", "FEATURED", "NON_FEATURED", "TOP_POS", "PUBLISH", "UNPUBLISH", "FLASH"),
    sort: Joi.string().required().valid("", "NEW_TO_OLD", "OLD_TO_NEW", "LH_SELL", "HL_SELL"),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const updateOrderSuggestedProduct = {
  body: Joi.object().keys({
    products: Joi.array().min(1).items(Joi.objectId()),
    isPosSuggest: Joi.boolean().required(),
  }),
};

const disableOrApproveOwnProduct = {
  body: Joi.object().keys({
    products: Joi.array().min(1).items(Joi.objectId()),
    isOwnDisabled: Joi.boolean().required(),
  }),
};

const updateProductVariationStatus = {
  body: Joi.object().keys({
    variantId: Joi.objectId().required(),
    isDisabled: Joi.boolean().required(),
  }),
};

const featureOwnProduct = {
  body: Joi.object().keys({
    products: Joi.array().min(1).items(Joi.objectId()),
    isFeatured: Joi.boolean().required(),
  }),
};

const resellerProductStatusUpdate = {
  body: Joi.object().keys({
    products: Joi.array().min(1).items(Joi.objectId()),
    isReseller: Joi.boolean().required(),
  }),
};

// reseller
const fetchAllProductsByReseller = {
  body: Joi.object().keys({
    categorySlug: Joi.string().required().allow(""),
    prodType: Joi.string()
      .required()
      .valid("", "FEATURED", "NON_FEATURED", "TOP_POS", "PUBLISH", "UNPUBLISH", "FLASH"),
    sort: Joi.string().required().valid("", "NEW_TO_OLD", "OLD_TO_NEW", "LH_SELL", "HL_SELL"),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

// admin customer
const fetchAllProductByCategory = {
  params: {
    categorySlug: Joi.string().required(),
  },
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

const fetchAllProductByBrand = {
  params: {
    brandSlug: Joi.string().required(),
  },
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

const viewProduct = {
  params: {
    productSlug: Joi.string().required(),
  },
};

const viewProductWithSimilarProduct = {
  params: {
    productSlug: Joi.string().required(),
  },
  query: {
    similarLimit: Joi.number().required(),
  },
};

const productSearch = {
  body: Joi.object().keys({
    value: Joi.string().allow(""),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const checkProductStock = {
  body: Joi.object().keys({
    productId: Joi.objectId().required(),
    variationId: Joi.objectId().required().allow(""),
  }),
};

const pagination = {
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

module.exports = {
  // admin
  createProduct,
  updateProduct,
  updateProductStock,
  productId,
  fetchAllProductsByAdmin,
  updateOrderSuggestedProduct,
  disableOrApproveOwnProduct,
  updateProductVariationStatus,
  featureOwnProduct,
  resellerProductStatusUpdate,

  // reseller
  fetchAllProductsByReseller,

  // admin customer
  fetchAllProductByCategory,
  fetchAllProductByBrand,
  viewProduct,
  viewProductWithSimilarProduct,

  // share
  productSearch,
  checkProductStock,
  pagination,
};
