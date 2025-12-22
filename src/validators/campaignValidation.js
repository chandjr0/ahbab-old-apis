const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createCampaign = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow("").required(),
    startDate: Joi.date().required(),
    products: Joi.array().min(1).items(Joi.objectId()),
  }),
};

const updateCampaign = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow("").required(),
    startDate: Joi.date().required(),
    products: Joi.array().min(1).items(Joi.objectId()),
  }),
};

const fetchAllCampaign = {
  body: Joi.object().keys({
    value: Joi.string().trim().required().allow(""),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

const addCampaignCost = {
  body: Joi.object().keys({
    campaignId: Joi.objectId().required(),
    usdCost: Joi.number().allow(0).required(),
    dollarRate: Joi.number().allow(0).required(),
    bdtCost: Joi.number().allow(0).required(),
    payTime: Joi.date().required(),
  }),
};

const updateCampaignCost = {
  body: Joi.object().keys({
    usdCost: Joi.number().allow(0).required(),
    dollarRate: Joi.number().allow(0).required(),
    bdtCost: Joi.number().allow(0).required(),
    payTime: Joi.date().required(),
  }),
};

const pagination = {
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

module.exports = {
  createCampaign,
  updateCampaign,
  fetchAllCampaign,
  addCampaignCost,
  updateCampaignCost,
  pagination,
};
