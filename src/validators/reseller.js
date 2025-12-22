const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

//= ============  visitor

const submitResellerFromByVisitor = {
  body: Joi.object().keys({
    referId: Joi.string().required().allow(""),
    name: Joi.string().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/)
      .required(),
    email: Joi.string().email().required(),
    fbId: Joi.string().allow(""),
    fbPageName: Joi.string().allow(""),
    whatsAppNo: Joi.string().allow(""),
    image: Joi.string().allow(""),
    nid: Joi.object().keys({
      number: Joi.string().required().allow(""),
      nidImage: Joi.string().allow(""),
    }),
    address: Joi.object().keys({
      present: Joi.string().required().allow(""),
      permanent: Joi.string().required().allow(""),
      office: Joi.string().allow(""),
    }),
    legalDocs: Joi.array().items(Joi.string()).required(),
    website: Joi.object().keys({
      domain: Joi.string().allow(""),
      url: Joi.string().allow(""),
    }),
    password: Joi.string().min(6).required(),
  }),
};

//= ============  reseller

const addNewReseller = {
  body: Joi.object().keys({
    applicantId: Joi.string().allow("").required(),
    referId: Joi.string().required().allow(""),
    commission: Joi.string().required().allow(0),
    name: Joi.string().required(),
    phone: Joi.string()
      .length(11)
      .regex(/^01\d{9}$/)
      .required(),
    email: Joi.string().email().required(),
    fbId: Joi.string().allow(""),
    fbPageName: Joi.string().allow(""),
    whatsAppNo: Joi.string().allow(""),
    image: Joi.string().allow(""),
    nid: Joi.object().keys({
      number: Joi.string().required().allow(""),
      nidImage: Joi.string().allow(""),
    }),
    address: Joi.object().keys({
      present: Joi.string().required().allow(""),
      permanent: Joi.string().required().allow(""),
      office: Joi.string().allow(""),
    }),
    legalDocs: Joi.array().items(Joi.string()).required(),
    website: Joi.object().keys({
      domain: Joi.string().allow(""),
      url: Joi.string().allow(""),
    }),
    password: Joi.string().min(6).required(),
    status: Joi.string().required().valid("active", "inactive"),
  }),
};

const updateReseller = {
  body: Joi.object().keys({
    referId: Joi.string().required().allow(""),
    commission: Joi.string().required().allow(0),
    name: Joi.string().required(),
    fbId: Joi.string().allow(""),
    fbPageName: Joi.string().allow(""),
    whatsAppNo: Joi.string().allow(""),
    image: Joi.string().allow(""),
    nid: Joi.object().keys({
      number: Joi.string().required(),
      nidImage: Joi.string().allow(""),
    }),
    address: Joi.object().keys({
      present: Joi.string().required().allow(""),
      permanent: Joi.string().required().allow(""),
      office: Joi.string().allow(""),
    }),
    legalDocs: Joi.array().items(Joi.string()).required(),
    website: Joi.object().keys({
      domain: Joi.string().allow(""),
      url: Joi.string().allow(""),
    }),
    password: Joi.string().when(Joi.not("").required(), {
      then: Joi.string().min(6).required(),
      otherwise: Joi.string().allow(""),
    }),
    status: Joi.string().required().valid("active", "inactive"),
  }),
};

const listOfReseller = {
  body: Joi.object().keys({
    value: Joi.string().required().allow(""),
    status: Joi.string().required().valid("all", "pending", "hold", "active", "inactive"),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const searchReseller = {
  body: Joi.object().keys({
    value: Joi.string().required().allow(""),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const updateResellerStatus = {
  body: Joi.object().keys({
    status: Joi.string().required().valid("pending", "hold", "active", "inactive"),
  }),
  params: Joi.object().keys({
    resellerId: Joi.objectId().required(),
  }),
};

const loginReseller = {
  body: Joi.object().keys({
    value: Joi.string().required(),
    password: Joi.string().min(6).required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const updatePaymentDetails = {
  body: Joi.object().keys({
    payTo: Joi.string().required().valid("", "bkash", "nagad", "rocket", "bank"),
    bkash: Joi.string().required().allow(""),
    nagad: Joi.string().required().allow(""),
    rocket: Joi.string().required().allow(""),
    bank: Joi.object().keys({
      bankName: Joi.string().required().allow(""),
      branchName: Joi.string().required().allow(""),
      accName: Joi.string().required().allow(""),
      accNumber: Joi.string().required().allow(""),
      routingNumber: Joi.string().required().allow(""),
    }),
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

const updatePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  }),
};

module.exports = {
  // visitor
  submitResellerFromByVisitor,

  // reseller
  addNewReseller,
  updateReseller,
  listOfReseller,
  searchReseller,
  updateResellerStatus,
  loginReseller,

  login,
  updatePaymentDetails,
  otpForResetRequest,
  verifyOtpForResetPassword,
  resetPassword,
  updatePassword,

  // employee
  employeeCreate,
  employeeUpdate,
  allEmployeeList,
};
