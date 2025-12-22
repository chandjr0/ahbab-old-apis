const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const pendingResellerPaymentList = {
  body: Joi.object().keys({
    value: Joi.string().required().allow(""),
  }),
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

const pendingOrderOfReseller = {
  body: Joi.object().keys({
    resellerId: Joi.objectId().required(),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

const makePaymentInvoice = {
  body: Joi.object().keys({
    orderIds: Joi.array().min(1).items(Joi.objectId()),
    files: Joi.array().items(Joi.string()).required(),
    details: Joi.string().required().allow(""),
  }),
};

const resellerInvoiceList = {
  body: Joi.object().keys({
    value: Joi.string().required().allow(""),
    status: Joi.string().required().valid("all", "pending", "confirm", "cancel"),
  }),
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

const updateResellerInvoiceStatus = {
  body: Joi.object().keys({
    status: Joi.string().required().valid("confirm", "cancel"),
  }),
  params: {
    invoiceId: Joi.objectId().required(),
  },
};

const pagination = {
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

module.exports = {
  pendingOrderOfReseller,
  pendingResellerPaymentList,
  makePaymentInvoice,
  resellerInvoiceList,
  updateResellerInvoiceStatus,

  pagination,
};
