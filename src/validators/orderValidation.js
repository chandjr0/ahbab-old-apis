const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const customerOrder = {
  body: Joi.object().keys({
    customerId: Joi.objectId().allow(""),
    products: Joi.array()
      .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variationId: Joi.objectId().required().allow(""),
          variationName: Joi.string().required().allow(""),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      ),
    promo: Joi.string().allow("").required(),
    payment: Joi.object().keys({
      paymentType: Joi.string().required().allow(""),
      amount: Joi.number().required().allow(0),
      details: Joi.string().required().allow(""),
      documentImg: Joi.string().required().allow(""),
    }),
    customerCharge: Joi.object().keys({
      totalProductPrice: Joi.number().required().allow(0),
      discountPrice: Joi.number().required().allow(0),
      deliveryCharge: Joi.number().required().allow(0),
      totalPayTk: Joi.number().required().allow(0),
    }),
    deliveryAddress: Joi.object().keys({
      name: Joi.string().required(),
      phone: Joi.string()
        .length(11)
        .regex(/^01\d{9}$/),
      address: Joi.string().min(10).required(),
    }),
  }),
};

const posOrder = {
  body: Joi.object().keys({
    customerId: Joi.objectId().allow(""),
    products: Joi.array()
      .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variationId: Joi.objectId().required().allow(""),
          variationName: Joi.string().required().allow(""),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      ),
    courierName: Joi.string().required().allow(""),
    adminNoteMessage: Joi.string().required().allow(""),
    payment: Joi.object().keys({
      paymentType: Joi.string().required().allow(""),
      amount: Joi.number().required().allow(0),
      details: Joi.string().required().allow(""),
      documentImg: Joi.string().required().allow(""),
    }),
    customerCharge: Joi.object().keys({
      totalProductPrice: Joi.number().required().allow(0),
      discountPrice: Joi.number().required().allow(0),
      deliveryCharge: Joi.number().required().allow(0),
      totalPayTk: Joi.number().required().allow(0),
    }),
    deliveryAddress: Joi.object().keys({
      name: Joi.string().required(),
      phone: Joi.string()
        .length(11)
        .regex(/^01\d{9}$/),
      address: Joi.string().min(10).required(),
    }),
    time: Joi.date().required(),
  }),
};

const orderId = {
  params: Joi.object().keys({
    orderId: Joi.objectId().allow(""),
  }),
};

const customerId = {
  params: Joi.object().keys({
    customerId: Joi.objectId().allow(""),
  }),
};

const fetchAllCustomerPendingOrder = {
  params: Joi.object().keys({
    customerId: Joi.objectId().required(),
    orderId: Joi.objectId().required(),
  }),
};

const serialId = {
  params: Joi.object().keys({
    serialId: Joi.string().required(),
  }),
};

const fetchAllOrder = {
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(
        "ALL",
        "PENDING",
        "HOLD",
        "CONFIRM",
        "PROCESSING",
        "PICKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELED",
        "RETURNED",
        "REFUND"
      ),
    createdBy: Joi.string().valid("ALL", "customer", "admin", "employee", "visitor").required(),
    courier: Joi.objectId().required().allow(""),
    employee: Joi.objectId().required().allow(""),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const searchOrder = {
  body: Joi.object().keys({
    value: Joi.string().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const updateOrderStatus = {
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(
        "ALL",
        "PENDING",
        "HOLD",
        "CONFIRM",
        "PROCESSING",
        "PICKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELED",
        "RETURNED"
      ),
    time: Joi.date().required(),
    returnMoney: Joi.number().required().allow(0),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const updateMultipleOrderStatus = {
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(
        "ALL",
        "PENDING",
        "HOLD",
        "CONFIRM",
        "PROCESSING",
        "PICKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELED"
      ),
    time: Joi.date().required(),
    orders: Joi.array().min(1).items(Joi.objectId()),
  }),
};

const updateOrderPaymentInfo = {
  body: Joi.object().keys({
    deliveryCharge: Joi.number().allow(0).required(),
    discountPrice: Joi.number().allow(0).required(),
    paymentType: Joi.string().required().allow(""),
    amount: Joi.number().allow(0).required(),
    details: Joi.string().required().allow(""),
    documentImg: Joi.string().required().allow(""),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const updateOrderCustomerAddress = {
  body: Joi.object().keys({
    address: Joi.string().min(10).required(),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const addAdminNote = {
  body: Joi.object().keys({
    note: Joi.string().required().allow(""),
    time: Joi.date().required(),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const updateCourier = {
  body: Joi.object().keys({
    courierId: Joi.objectId().required().allow(null),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const returnRefundOrder = {
  body: Joi.object().keys({
    refundMoney: Joi.number().required().allow(0),
    returnMoney: Joi.number().required().allow(0),
    products: Joi.array().items(
      Joi.object().keys({
        productId: Joi.objectId().required(),
        variationId: Joi.objectId().required().allow(null),
        returnQty: Joi.number().required(),
      })
    ),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const fetchMultipleOrder = {
  body: Joi.object().keys({
    serialIds: Joi.array().items(Joi.string().required()),
  }),
};

// reseller
const createPosOrderByReseller = {
  body: Joi.object().keys({
    customerId: Joi.objectId().allow(""),
    products: Joi.array()
      .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variationId: Joi.objectId().required().allow(""),
          variationName: Joi.string().required().allow(""),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      ),
    // adminNoteMessage: Joi.string().required().allow(""),
    payment: Joi.object().keys({
      paymentType: Joi.string().required().allow(""),
      amount: Joi.number().required().allow(0),
      details: Joi.string().required().allow(""),
      documentImg: Joi.string().required().allow(""),
    }),
    customerCharge: Joi.object().keys({
      totalProductPrice: Joi.number().required().allow(0),
      discountPrice: Joi.number().required().allow(0),
      deliveryCharge: Joi.number().required().allow(0),
      totalPayTk: Joi.number().required().allow(0),
    }),
    deliveryAddress: Joi.object().keys({
      name: Joi.string().required(),
      phone: Joi.string()
        .length(11)
        .regex(/^01\d{9}$/),
      address: Joi.string().min(10).required(),
    }),
  }),
};

const fetchAllOrderReseller = {
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(
        "ALL",
        "PENDING",
        "HOLD",
        "CONFIRM",
        "PROCESSING",
        "PICKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELED",
        "RETURNED",
        "REFUND"
      ),
    createdBy: Joi.string().valid("ALL", "customer", "reseller", "visitor").required(),
    courier: Joi.objectId().required().allow(""),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

// customer
const fetchAllAdminCustomerOrder = {
  body: Joi.object().keys({
    customerId: Joi.objectId().allow(""),
  }),
  query: {
    page: Joi.number().required(),
    limit: Joi.number().required(),
  },
};

module.exports = {
  customerOrder,
  posOrder,
  fetchAllOrder,
  customerId,
  fetchAllCustomerPendingOrder,
  serialId,
  searchOrder,
  updateOrderStatus,
  updateMultipleOrderStatus,
  updateOrderPaymentInfo,
  updateOrderCustomerAddress,
  addAdminNote,
  updateCourier,
  orderId,
  returnRefundOrder,
  fetchMultipleOrder,

  // reseller
  createPosOrderByReseller,
  fetchAllOrderReseller,

  // customer
  fetchAllAdminCustomerOrder,
};
