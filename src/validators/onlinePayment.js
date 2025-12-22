const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const success = {
  query: Joi.object().keys({
    status: Joi.string().default("success"),
  }),
};

const fail = {
  query: Joi.object().keys({
    status: Joi.string().default("fail"),
  }),
};

const cancel = {
  query: Joi.object().keys({
    status: Joi.string().default("cancel"),
    domain: Joi.string(),
    serialId: Joi.string(),
    origin: Joi.string(),
  }),
};

const bkashCreate = {
  body: Joi.object().keys({
    bkashAppKey: Joi.string().optional(),
    bkashAppSecret: Joi.string().optional(),
    bkashPassword: Joi.string().optional(),
    bkashUsername: Joi.string().optional(),
    isBkashActive: Joi.boolean().optional(),
  }),
};

module.exports = { success, fail, cancel, bkashCreate };
