const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const createAdmin = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const signIn = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const updatePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  }),
};

const dashboardOrderHistory = {
  body: Joi.object().keys({
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
};

const otpForResetRequest = {
  body: Joi.object().keys({
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
  }),
};

const verifyOtpForResetPassword = {
  body: Joi.object().keys({
    otpCode: Joi.string().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string().required(),
    token: Joi.string().required(),
  }),
};

// employee
const employeeCreate = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    email: Joi.string().required(),
    password: Joi.string().min(4).required(),
    isDisabled: Joi.boolean().required(),
    image: Joi.string().required().allow(""),
  }),
};

const employeeUpdate = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    email: Joi.string().required(),
    password: Joi.string().min(4).required(),
    isDisabled: Joi.boolean().required(),
    image: Joi.string().required().allow(""),
  }),
  params: Joi.object().keys({
    employeeId: Joi.objectId().required(),
  }),
};

const allEmployeeList = {
  body: Joi.object().keys({
    value: Joi.string().required().allow(""),
  }),
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

const pagination = {
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

module.exports = {
  createAdmin,
  signIn,
  updatePassword,
  dashboardOrderHistory,
  otpForResetRequest,
  verifyOtpForResetPassword,
  resetPassword,

  // employee
  employeeCreate,
  employeeUpdate,
  allEmployeeList,

  pagination,
};
