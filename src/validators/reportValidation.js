const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const accountReportByDateRange = {
  body: Joi.object().keys({
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
};

module.exports = {
  accountReportByDateRange,
};
