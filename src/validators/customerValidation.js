const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const phoneCheck = {
  body: Joi.object().keys({
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
  }),
};

const directCustomerRegistration = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    email: Joi.string().email().required().allow(""),
    password: Joi.string().required(),
  }),
};

const customerRegistration = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    password: Joi.string().required(),
  }),
};

const otpVerifyForRegistration = {
  body: Joi.object().keys({
    otpCode: Joi.string().required(),
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

// delete
const signup = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    password: Joi.string().required(),
  }),
};

const signin = {
  body: Joi.object().keys({
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/),
    password: Joi.string().required(),
  }),
};

const loginOtpSend = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
  }),
};

const loginOtpVerify = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
    otpCode: Joi.string().required(),
  }),
};

const updateCustomer = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    address: Joi.string().required().allow(""),
    image: Joi.string().required().allow(""),
  }),
};

const pageCheck = {
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  }),
};

const fetchCustomersByPhoneOrName = {
  body: Joi.object().keys({
    value: Joi.string().required().allow(""),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const promotionalBulkSms = {
  body: Joi.object().keys({
    numbers: Joi.array().min(1).items(Joi.string()),
    message: Joi.string().required(),
  }),
};

const fetchAllCustomerList = {
  body: Joi.object().keys({
    value: Joi.string().required().allow(""),
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
  directCustomerRegistration,
  customerRegistration,
  otpVerifyForRegistration,
  otpForResetRequest,
  verifyOtpForResetPassword,
  resetPassword,

  phoneCheck,
  signup,
  signin,
  loginOtpSend,
  loginOtpVerify,
  changePassword,
  updateCustomer,
  pageCheck,
  fetchCustomersByPhoneOrName,
  promotionalBulkSms,

  fetchAllCustomerList,
};
