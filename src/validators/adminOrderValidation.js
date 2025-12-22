const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

const orderOtpSend = {
  body: Joi.object().keys({
    phone: Joi.string().required()
  }),
};

const orderOtpVerify = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
    otpCode: Joi.string().required()
  }),
};

const posOrder = {
  body: Joi.object().keys({
    customerId: Joi.objectId().allow(""),
    products: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variationId: Joi.alternatives().conditional("isVariant", {
            is: true,
            then: Joi.objectId().required(),
            otherwise: Joi.string().valid(""),
          }),
          variationName: Joi.string().required().allow(""),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      )
      .required(),
    combos: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          comboId: Joi.objectId().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
          uid: Joi.string(),
          products: Joi.array()
            .min(1)
            .items(
              Joi.object().keys({
                productId: Joi.objectId().required(),
                isVariant: Joi.boolean().required(),
                variationId: Joi.alternatives().conditional("isVariant", {
                  is: true,
                  then: Joi.objectId().required(),
                  otherwise: Joi.string().valid(""),
                }),
                variationName: Joi.string().required().allow(""),
              })
            ),
        })
      )
      .required(),
    adminNoteMessage: Joi.string().required().allow(""),
    customerNote: Joi.string().required().allow(""),
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
    deliveryType: Joi.string().required().valid("inside", "outside"),
    deliveryAddress: Joi.object().keys({
      name: Joi.string().required(),
      phone: Joi.string()
        .length(11)
        .regex(/^01\d{9}$/),
      cityId: Joi.objectId().required(),
      zoneId: Joi.objectId().required(),
      areaId: Joi.objectId(),
      address: Joi.string().min(10).required(),
    }),
  }),
};

const fetchAllIncompleteOrder = {
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
    status: Joi.string().valid('CANCELED', 'PENDING', 'ALL').optional(),
    startTime: Joi.date().allow(null, ''),
    endTime: Joi.date().allow(null, ''),
  }),
};

const customerIncompleteOrder = {
  body: Joi.object().keys({
    visitorId: Joi.string().required(),
    customerId: Joi.objectId().allow("", null),
    products: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variationId: Joi.alternatives().conditional("isVariant", {
            is: true,
            then: Joi.objectId().required(),
            otherwise: Joi.string().valid(""),
          }),
          variationName: Joi.string().required().allow(""),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      ),
    combos: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          comboId: Joi.objectId().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
          uid: Joi.string(),
          products: Joi.array()
            .min(1)
            .items(
              Joi.object().keys({
                productId: Joi.objectId().required(),
                isVariant: Joi.boolean().required(),
                variationId: Joi.alternatives().conditional("isVariant", {
                  is: true,
                  then: Joi.objectId().required(),
                  otherwise: Joi.string().valid(""),
                }),
                variationName: Joi.string().required().allow(""),
              })
            ),
        })
      ),
    customerNote: Joi.string().allow(null, ''),
    promo: Joi.string().allow("").required(),
    onlinePaymentReq: Joi.boolean().default(false),
    host: Joi.string().required(),
    payment: Joi.object().keys({
      paymentType: Joi.string().allow(null, ''),
      amount: Joi.number().required().allow(0),
      details: Joi.string().allow(null, ''),
      documentImg: Joi.string().allow(null, ''),
    }),
    deliveryType: Joi.string().allow(null, ''),
    customerCharge: Joi.object().keys({
      totalProductPrice: Joi.number().required().allow(0),
      discountPrice: Joi.number().required().allow(0),
      deliveryCharge: Joi.number().required().allow(0),
      totalPayTk: Joi.number().required().allow(0),
    }),
    deliveryAddress: Joi.object().keys({
      name: Joi.string().allow(null, ''),
      phone: Joi.string()
        .length(11)
        .regex(/^01\d{9}$/),
      cityId: Joi.string().allow(null),
      address: Joi.string().allow(null, ''),
    }),
    isAppOrder: Joi.boolean().optional()
  }),
};

const incompleteOrderUpdate = {
  body: Joi.object().keys({
    orderId: Joi.objectId().required(),
    status: Joi.string().required().valid("CONFIRM", "CANCELED"),
    phone: Joi.alternatives().conditional("status", {
      is: "CONFIRM",
      then: Joi.string()
        .length(11)
        .regex(/^01\d{9}$/)
        .required(),
      otherwise: Joi.string().allow(null, '').optional()
    }),
    name: Joi.alternatives().conditional("status", {
      is: "CONFIRM", 
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null, '').optional()
    }),
    cityId: Joi.alternatives().conditional("status", {
      is: "CONFIRM",
      then: Joi.objectId().required(),
      otherwise: Joi.string().allow(null, '').optional()
    }),
    zoneId: Joi.alternatives().conditional("status", {
      is: "CONFIRM",
      then: Joi.objectId().required(),
      otherwise: Joi.string().allow(null, '').optional()
    }),
    address: Joi.alternatives().conditional("status", {
      is: "CONFIRM",
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null, '').optional()
    })
  }),
};

const UpdateOrder = {
  body: Joi.object().keys({
    customerId: Joi.objectId().required(),
    products: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variationId: Joi.alternatives().conditional("isVariant", {
            is: true,
            then: Joi.objectId().required(),
            otherwise: Joi.string().valid(""),
          }),
          variationName: Joi.string().required().allow(""),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      )
      .required(),
    combos: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          comboId: Joi.objectId().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
          uid: Joi.string(),
          products: Joi.array()
            .min(1)
            .items(
              Joi.object().keys({
                productId: Joi.objectId().required(),
                isVariant: Joi.boolean().required(),
                variationId: Joi.alternatives().conditional("isVariant", {
                  is: true,
                  then: Joi.objectId().required(),
                  otherwise: Joi.string().valid(""),
                }),
                variationName: Joi.string().required().allow(""),
              })
            ),
        })
      )
      .required(),
    adminNoteMessage: Joi.string().required().allow(""),
    customerNote: Joi.string().required().allow(""),
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
    deliveryType: Joi.string().required().valid("inside", "outside"),
    deliveryAddress: Joi.object().keys({
      name: Joi.string().required(),
      phone: Joi.string()
        .length(11)
        .regex(/^01\d{9}$/),
      cityId: Joi.objectId().required(),
      zoneId: Joi.objectId().required(),
      areaId: Joi.objectId(),
      address: Joi.string().min(10).required(),
    }),
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
        "INVOICED",
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

const fetchMultipleOrder = {
  body: Joi.object().keys({
    serialIds: Joi.array().items(Joi.string().required()),
  }),
};

const updateOrderStatus = {
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(
        "PENDING",
        "HOLD",
        "INVOICED",
        "CONFIRM",
        "PROCESSING",
        "PICKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELED",
        "RETURNED"
      ),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const updateOrderStatusReadyToShip_TO_Shipping = {
  body: Joi.object().keys({
    courierId: Joi.objectId().required(),
    orders: Joi.array().min(1).items(Joi.objectId()),
  })
};

const updateMultipleOrderStatus = {
  body: Joi.object().keys({
    status: Joi.string().required().valid("PENDING", "CONFIRM", "INVOICED"),
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
    districtId: Joi.objectId().required(),
    areaId: Joi.objectId(),
    address: Joi.string().min(10).required(),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const addAdminNote = {
  body: Joi.object().keys({
    note: Joi.string().required(),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const updateCustomerNote = {
  body: Joi.object().keys({
    customerNote: Joi.string().required().allow(""),
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

//= ================= customer

const customerOrder = {
  body: Joi.object().keys({
    customerId: Joi.objectId().allow(""),
    products: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          productId: Joi.objectId().required(),
          isVariant: Joi.boolean().required(),
          variationId: Joi.alternatives().conditional("isVariant", {
            is: true,
            then: Joi.objectId().required(),
            otherwise: Joi.string().valid(""),
          }),
          variationName: Joi.string().required().allow(""),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      ),
    combos: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          comboId: Joi.objectId().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
          uid: Joi.string(),
          products: Joi.array()
            .min(1)
            .items(
              Joi.object().keys({
                productId: Joi.objectId().required(),
                isVariant: Joi.boolean().required(),
                variationId: Joi.alternatives().conditional("isVariant", {
                  is: true,
                  then: Joi.objectId().required(),
                  otherwise: Joi.string().valid(""),
                }),
                variationName: Joi.string().required().allow(""),
              })
            ),
        })
      ),
    customerNote: Joi.string().required().allow(""),
    promo: Joi.string().allow("").required(),
    onlinePaymentReq: Joi.boolean().default(false),
    host: Joi.string().required(),
    payment: Joi.object().keys({
      paymentType: Joi.string().required().allow(""),
      amount: Joi.number().required().allow(0),
      details: Joi.string().required().allow(""),
      documentImg: Joi.string().required().allow(""),
    }),
    deliveryType: Joi.string().required().valid("inside", "outside"),
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
      cityId: Joi.objectId().required(),
      zoneId: Joi.objectId().required(),
      areaId: Joi.objectId(),
      address: Joi.string().min(10).required(),
    }),
  }),
};

const fetchCustomerAllOrder = {
  params: Joi.object().keys({
    customerId: Joi.objectId().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const makeOrdersInvoice = {
  body: Joi.object().keys({
    orderIds: Joi.array().min(1).items(Joi.objectId()).required(),
  }),
};

module.exports = {
  posOrder,
  UpdateOrder,
  fetchAllOrder,
  fetchAllIncompleteOrder,
  incompleteOrderUpdate,
  searchOrder,
  fetchMultipleOrder,

  // admin actions
  updateOrderStatus,
  updateOrderStatusReadyToShip_TO_Shipping,
  updateMultipleOrderStatus,
  updateOrderPaymentInfo,
  updateOrderCustomerAddress,
  addAdminNote,
  updateCustomerNote,
  updateCourier,

  // customer
  orderOtpSend,
  orderOtpVerify,
  
  customerOrder,
  customerIncompleteOrder,
  fetchCustomerAllOrder,
  makeOrdersInvoice,
};
