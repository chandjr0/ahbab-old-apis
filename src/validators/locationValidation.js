const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const addArea = {
  body: Joi.object().keys({
    districtId: Joi.objectId().required(),
    name: Joi.string().required(),
  }),
};

const removeArea = {
  params: Joi.object().keys({
    areaId: Joi.objectId().required(),
  }),
};

module.exports = {
  addArea,
  removeArea,
};
