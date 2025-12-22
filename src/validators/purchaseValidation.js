const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createPurchase = {
  body: Joi.object().keys({
    supplierId: Joi.objectId(),
    totalBill: Joi.number().required(),
    adminNote: Joi.string().allow(""),
    createdBy: Joi.string().allow(""),
    document: Joi.string().allow(""),
    products: Joi.array()
      .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variationId: Joi.objectId().required().allow(null),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      ),
  }),
};

const deletePurchase = {
  params: {
    purchaseId: Joi.objectId().required(),
  },
};

const fetchAllPurchase = {
  query: Joi.object().keys({
    status: Joi.string().required().valid("ALL", "PENDING", "RECEIVED", "CANCELED"),
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const fetchSinglePurchase = {
  params: {
    serialId: Joi.string().required(),
  },
};

const updatePurchaseStatus = {
  body: Joi.object().keys({
    purchaseIds: Joi.array().min(1).items(Joi.objectId()),
    status: Joi.string().required().valid("ALL", "PENDING", "RECEIVED", "CANCELED"),
    time: Joi.date().required(),
  }),
};

const addAdminNote = {
  body: Joi.object().keys({
    note: Joi.string().required().allow(""),
    time: Joi.date().allow(""),
  }),
  params: Joi.object().keys({
    purchaseId: Joi.objectId().required(),
  }),
};

const searchPurchase = {
  body: Joi.object().keys({
    value: Joi.string().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

module.exports = {
  createPurchase,
  deletePurchase,
  fetchAllPurchase,
  fetchSinglePurchase,
  updatePurchaseStatus,
  addAdminNote,
  searchPurchase,
};
