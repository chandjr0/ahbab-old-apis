const { Joi } = require("celebrate");
Joi.objectId = require("joi-objectid")(Joi);

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
    resellerNoteMessage: Joi.string().required().allow(""),
    customerNote: Joi.string().required().allow(""),
    customerCharge: Joi.object().keys({
      totalProductPrice: Joi.number().required().allow(0),
      deliveryCharge: Joi.number().required().allow(0),
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

const UpdateOrderByAdmin = {
  body: Joi.object().keys({
    resellerId: Joi.objectId().required(),
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

const UpdateOrderByReseller = {
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
    resellerNoteMessage: Joi.string().required().allow(""),
    customerNote: Joi.string().required().allow(""),
    customerCharge: Joi.object().keys({
      totalProductPrice: Joi.number().required().allow(0),
      deliveryCharge: Joi.number().required().allow(0),
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

const fetchAllPendingOrder = {
  body: Joi.object().keys({
    resellerStatus: Joi.string().required().valid("all", "pending", "hold", "cancel"),
    startTime: Joi.date().required().allow(null),
    endTime: Joi.date().required().allow(null),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const searchPendingOrder = {
  body: Joi.object().keys({
    value: Joi.string().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
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
    createdBy: Joi.string().valid("ALL", "reseller", "customer", "visitor").required(),
    courier: Joi.objectId().required().allow(""),
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

const updateOrderStatusByReseller = {
  body: Joi.object().keys({
    status: Joi.string().required().valid("pending", "hold", "confirm", "cancel"),
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

const addResellerNote = {
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
      )
      .required(),
    combos: Joi.array()
      // .min(1)
      .items(
        Joi.object().keys({
          comboId: Joi.objectId().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
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
    // .required(),
    customerNote: Joi.string().required().allow(""),
    promo: Joi.string().allow("").required(),
    onlinePaymentReq: Joi.boolean().default(false),
    host: Joi.string().required(),
    deliveryType: Joi.string().required().valid("inside", "outside"),
    customerCharge: Joi.object().keys({
      totalProductPrice: Joi.number().required().allow(0),
      discountPrice: Joi.number().required().allow(0),
      deliveryCharge: Joi.number().required().allow(0),
    }),
    deliveryAddress: Joi.object().keys({
      name: Joi.string().required(),
      phone: Joi.string()
        .length(11)
        .regex(/^01\d{9}$/),
      cityId: Joi.objectId(),
      zoneId: Joi.objectId(),
      areaId: Joi.objectId(),
      address: Joi.string().min(10).required(),
    }),
  }),
};

// ----------- admin -----------
const fetchAllOrderByAdmin = {
  body: Joi.object().keys({
    resellerId: Joi.objectId().allow(""),
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

const searchOrderByAdmin = {
  body: Joi.object().keys({
    resellerId: Joi.objectId().required().allow(""),
    value: Joi.string().required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
};

const fetchMultipleOrderByAdmin = {
  body: Joi.object().keys({
    serialIds: Joi.array().items(Joi.string().required()),
  }),
};

const updateOrderStatusByAdmin = {
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
        "CANCELED"
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

const updateOrderPaymentInfoByAdmin = {
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

const updateOrderCustomerAddressByAdmin = {
  body: Joi.object().keys({
    districtId: Joi.objectId().required(),
    areaId: Joi.objectId(),
    address: Joi.string().min(10).required(),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const addAdminNoteByAdmin = {
  body: Joi.object().keys({
    note: Joi.string().required(),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const updateCustomerNoteByAdmin = {
  body: Joi.object().keys({
    customerNote: Joi.string().required().allow(""),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
  }),
};

const updateCourierByAdmin = {
  body: Joi.object().keys({
    courierId: Joi.objectId().required().allow(null),
  }),
  params: Joi.object().keys({
    orderId: Joi.objectId().required(),
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

module.exports = {
  // --- reseller --
  posOrder,
  UpdateOrderByReseller,
  // pending order
  fetchAllPendingOrder,
  searchPendingOrder,
  // confirm order
  fetchAllOrder,
  searchOrder,
  fetchMultipleOrder,
  // reseller actions
  updateOrderStatusByReseller,
  updateOrderCustomerAddress,
  addResellerNote,
  updateCustomerNote,

  // customer
  customerOrder,

  // --- admin --
  UpdateOrderByAdmin,
  fetchAllOrderByAdmin,
  searchOrderByAdmin,
  fetchMultipleOrderByAdmin,

  // admin actions
  updateOrderStatusByAdmin,
  updateOrderStatusReadyToShip_TO_Shipping,
  updateMultipleOrderStatus,
  updateOrderPaymentInfoByAdmin,
  updateOrderCustomerAddressByAdmin,
  addAdminNoteByAdmin,
  updateCustomerNoteByAdmin,
  updateCourierByAdmin,

  fetchCustomerAllOrder,
};
