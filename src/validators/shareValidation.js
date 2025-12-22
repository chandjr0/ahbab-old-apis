const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

// Page No Check
const pageValidaiton = {
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

module.exports = { pageValidaiton };
