const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const dashboardOrderHistory = {
  body: Joi.object().keys({
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
};

const resellerOrderHistoryByAdmin = {
  body: Joi.object().keys({
    value: Joi.string().allow(""),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
};

const topResellersByAdmin = {
  body: Joi.object().keys({
    sortBy: Joi.string().allow("commission", "orderNum", "orderAmount"),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
};

const topProductsByAdmin = {
  body: Joi.object().keys({
    sortBy: Joi.string().allow("commission", "quantity", "price"),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
};

const topProductsFromAllOrder = {
  body: Joi.object().keys({
    sortBy: Joi.string().allow("quantity", "price"),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
};

const topProductsFromResellerOrder = {
  body: Joi.object().keys({
    sortBy: Joi.string().allow("commission", "quantity", "price"),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
};

const districtBaseOrder = {
  body: Joi.object().keys({
    orderType: Joi.string().required().valid("all", "own", "reseller"),
    sortBy: Joi.string().required().valid("orderNum", "price"),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

module.exports = {
  dashboardOrderHistory,
  resellerOrderHistoryByAdmin,
  topResellersByAdmin,
  topProductsByAdmin,
  topProductsFromAllOrder,
  topProductsFromResellerOrder,
  districtBaseOrder,
};
