const { nanoid } = require("nanoid");
// const QRCode = require("qrcode");
// const sharp = require("sharp");
const bcrypt = require("bcryptjs");

const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const OrderModel = require("../../models/order/order");
const ProductModel = require("../../models/product/product");
const VariationModel = require("../../models/product/variation");
// const PromoModel = require("../../models/product/promo");
const CustomerModel = require("../../models/user/customer");
const orderQuery = require("../../helpers/orderQuery");
const deleteFile = require("../../utils/delete-file");
const { promoVerify } = require("../../helpers/promoQuery");
const customMetaData = require("../../helpers/customMetaData");

// const PurchaseProductModel = require("../../models/purchase/purchaseProducts");

const {
  updateProductStock,
  updateProductReturnStock,
  checkProductForOrder,
} = require("../../helpers/productQuery");
const { orderSerialNumber } = require("../../helpers/shareFunc");

const uploadImage = require("../../utils/upload-img");
const pagination = require("../../helpers/paginationQuery");
const createOrderInvoice = require("../../invoices/orderInvoice").createInvoiceSingle;

const {
  pendingOrderMsg,
  // confirmOrderMsg, holdOrderMsg, cancelOrderMsg,
} = require("../../service/smsList");
const smsSend = require("../../service/smsService");

const orderProjection = {
  orderType: 1,
  customerId: 1,
  products: 1,
  serialId: 1,
  orderStatus: 1,
  // courierName: 1,
  courierData: 1,
  adminNote: 1,
  payment: 1,
  paymentHistory: 1,
  deliveryAddress: 1,
  customerCharge: 1,
  deliverySiteCost: 1,
  adminRevenue: 1,
  createdBy: 1,
  createdAt: 1,
  refundMoney: 1,
  returnMoney: 1,
  isReturn: 1,
  isRefund: 1,
  updateHistory: 1,
  courierTrackId: 1,
  trackId: 1,
  courierStatus: 1,
};

// CREATE CUSTOMER ORDER
const createCustomerOrder = async (req, res) => {
  try {
    if (req.user.role === "customer" && req.user._id !== req.body.customerId) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Unauthorize customer. Check it from frontend!",
      });
    }

    try {
      await Promise.all(
        req.body.products.map((product) => checkProductForOrder(product, false, true))
      );
    } catch (err) {
      return res.status(409).json({
        data: null,
        success: false,
        message: err?.message,
      });
    }

    const allProducts = [];
    req.body.products.forEach((product) => {
      const productObj = product;
      if (product?.variationId === "") {
        productObj.variationId = null;
      }
      allProducts.push(productObj);
    });
    req.body.products = allProducts;

    let sumOfTotalProductPrice = 0;
    req.body.products.forEach((product) => {
      sumOfTotalProductPrice += product.price * product.quantity;
    });

    if (req.body.promo !== "") {
      const promoData = await promoVerify(req.body.promo, sumOfTotalProductPrice);

      if (promoData?.msg !== "") {
        return res.status(400).json({
          data: null,
          success: false,
          message: promoData?.msg,
        });
      }

      if (promoData?.amount !== req.body.customerCharge.discountPrice) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Wrong discount amount!",
        });
      }
    }

    if (sumOfTotalProductPrice !== req.body.customerCharge.totalProductPrice) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Wrong calculation in total product price!",
      });
    }

    const serialId = await orderSerialNumber();

    // const qrcode = `public/qrcode/${serialId}.png`;
    // QRCode.toBuffer(serialId, (err, qrBuffer) => {
    //   sharp(qrBuffer).rotate().toFile(qrcode);
    // });

    if (req.body.payment.documentImg !== "") {
      req.body.payment.documentImg = uploadImage(req.body.payment.documentImg, "public/order/");
    }

    if (req.body.customerId) {
      const isExistCustomer = await CustomerModel.findOne({ _id: req.body.customerId });
      if (!isExistCustomer) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Customer not found!",
        });
      }
    }

    if (req.body.customerId === "") {
      const checkCustomer = await CustomerModel.findOne({
        userName: req.body.deliveryAddress.phone,
      });
      if (checkCustomer) {
        req.body.customerId = checkCustomer?._id;
      } else {
        const hashPassword = await bcrypt.hash("1234", 12);
        const customerData = await CustomerModel.create({
          ...req.body.deliveryAddress,
          userName: req.body.deliveryAddress.phone,
          password: hashPassword,
        });
        req.body.customerId = customerData?._id;
      }
    }

    const orderObj = {
      orderType: req.user.role,
      customerId: req.body.customerId,
      products: req.body.products,
      serialId,
      // qrcode,
      orderStatus: [{ status: "PENDING", time: new Date(), changeBy: req.user.role }],
      payment: req.body.payment,
      paymentHistory: [{ amount: req.body.customerCharge.totalPayTk }],
      deliveryAddress: req.body.deliveryAddress,
      customerCharge: req.body.customerCharge,
      createdBy: req.user.role,
    };

    const orderData = await OrderModel.create(orderObj);
    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to create order!",
      });
    }

    const message = pendingOrderMsg(orderData?.serialId, orderData?.customerCharge?.remainingTkPay);
    if (message !== "") {
      try {
        await smsSend(orderData?.deliveryAddress?.phone, message);
      } catch (err) {
        // return res.status(426).json({
        //   data: null,
        //   success: false,
        //   message: err?.message,
        // });
      }
    }
    // update products stocks
    await Promise.all(orderData.products.map((product) => updateProductStock(product, -1)));

    return res.status(201).json({
      data: orderData,
      success: true,
      message: "Create order successfully.",
    });
  } catch (err) {
    console.log("*** orderController: createCustomerOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// CREATE POS ORDER
const createPosOrder = async (req, res) => {
  try {
    if (req.body.customerId) {
      const isExistCustomer = await CustomerModel.findOne({ _id: req.body.customerId });
      if (!isExistCustomer) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Customer not found!",
        });
      }
    }

    try {
      await Promise.all(
        req.body.products.map((product) => checkProductForOrder(product, false, false))
      );
    } catch (err) {
      return res.status(409).json({
        data: null,
        success: false,
        message: err?.message,
      });
    }

    const allProducts = [];
    req.body.products.forEach((product) => {
      const productObj = product;
      if (product?.variationId === "") {
        productObj.variationId = null;
      }
      allProducts.push(productObj);
    });
    req.body.products = allProducts;

    let sumOfTotalProductPrice = 0;
    req.body.products.forEach((product) => {
      sumOfTotalProductPrice += product.price * product.quantity;
    });

    if (sumOfTotalProductPrice !== req.body.customerCharge.totalProductPrice) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Wrong calculation in total product price!",
      });
    }

    const serialId = await orderSerialNumber();

    // const qrcode = `public/qrcode/${serialId}.png`;
    // QRCode.toBuffer(serialId, (err, qrBuffer) => {
    //   sharp(qrBuffer).rotate().toFile(qrcode);
    // });

    if (req.body.payment.documentImg !== "") {
      req.body.payment.documentImg = uploadImage(req.body.payment.documentImg, "public/order/");
    }

    if (req.body.customerId === "") {
      const checkCustomer = await CustomerModel.findOne({
        userName: req.body.deliveryAddress.phone,
        phone: req.body.deliveryAddress.phone,
      });
      if (checkCustomer) {
        checkCustomer.address = req.body.deliveryAddress.address;
        await checkCustomer.save();
        req.body.customerId = checkCustomer?._id;
      } else {
        const hashPassword = await bcrypt.hash("1234", 12);
        const customerData = await CustomerModel.create({
          ...req.body.deliveryAddress,
          userName: req.body.deliveryAddress.phone,
          password: hashPassword,
        });
        req.body.customerId = customerData?._id;
      }
    }

    const orderObj = {
      orderType: req.user.role,
      customerId: req.body.customerId,
      products: req.body.products,
      serialId,
      // qrcode,
      orderStatus: [
        {
          status: "CONFIRM",
          time: new Date().toISOString(),
          changeBy: req.user.role === "admin" ? "admin" : req.user.name,
          employeeId: req.user.role === "admin" ? null : req.user._id,
        },
      ],
      courierName: req.body.courierName,
      adminNote: [
        {
          message: req.body.adminNoteMessage,
          createdBy: req.user?.role ? "admin" : req?.user?.name,
          time: new Date().toISOString(),
        },
      ],
      payment: req.body.payment,
      paymentHistory: [{ amount: req.body.customerCharge.totalPayTk }],
      deliveryAddress: req.body.deliveryAddress,
      customerCharge: req.body.customerCharge,
      employeeId: req.user.role === "admin" ? null : req.user._id,
      createdBy: req.user.role === "employee" ? req.user.name : req.user.role,
      createdAt: req.body.time,
    };

    if (req.body.adminNoteMessage === "") {
      delete orderObj.adminNote;
    }

    const orderData = await OrderModel.create(orderObj);
    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to create order!",
      });
    }

    const message = pendingOrderMsg(orderData?.serialId, orderData?.customerCharge?.remainingTkPay);
    if (message !== "") {
      try {
        await smsSend(orderData?.deliveryAddress?.phone, message);
      } catch (err) {
        // return res.status(426).json({
        //   data: null,
        //   success: false,
        //   message: err?.message,
        // });
      }
    }

    // update products stocks
    await Promise.all(orderData.products.map((product) => updateProductStock(product, -1)));

    return res.status(201).json({
      data: orderData,
      success: true,
      message: "Create order successfully.",
    });
  } catch (err) {
    console.log("*** orderController: createCustomerOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// Update ORDER
const UpdateOrder = async (req, res) => {
  try {
    // return res.json({ data: req.body });
    const orderData = await OrderModel.findOne({ serialId: req.params.serialId });

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to update order!`,
      });
    }
    await Promise.all(orderData.products.map((product) => updateProductStock(product, 1)));

    const allProducts = [];
    req.body.products.forEach((product) => {
      const productObj = product;
      if (product?.variationId === "") {
        productObj.variationId = null;
      }
      allProducts.push(productObj);
    });
    req.body.products = allProducts;

    let sumOfTotalProductPrice = 0;
    req.body.products.forEach((product) => {
      sumOfTotalProductPrice += product.price * product.quantity;
    });

    if (sumOfTotalProductPrice !== req.body.customerCharge.totalProductPrice) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "Wrong calculation in total product price!",
      });
    }

    // delete previous doc img
    if (req.body.payment.documentImg) {
      const isNewImage = req.body.payment.documentImg.substring(0, 6);
      if (isNewImage !== "public") {
        req.body.payment.documentImg = uploadImage(req.body.payment.documentImg, "public/order/");
        if (orderData?.payment?.documentImg) {
          deleteFile(orderData?.payment?.documentImg);
        }
      }
    } else if (!req.body.payment.documentImg && orderData?.payment?.documentImg) {
      req.body.payment.documentImg = "";
      deleteFile(orderData?.payment?.documentImg);
    }

    const isExistCustomer = await CustomerModel.findOne({ _id: req.body.customerId });
    if (!isExistCustomer) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Customer not found!",
      });
    }
    isExistCustomer.address = req.body.deliveryAddress.address;
    await isExistCustomer.save();

    orderData.products = req.body.products;
    orderData.courierName = req.body.courierName;
    if (req.body.adminNoteMessage) {
      orderData.adminNote = [
        {
          message: req.body.adminNoteMessage,
          createdBy: req.user?.role === "admin" ? "admin" : req?.user?.name,
          time: req.body.time,
        },
        ...orderData.adminNote,
      ];
    }

    orderData.payment = req.body.payment;
    orderData.paymentHistory = [{ amount: req.body.customerCharge.totalPayTk }];
    orderData.deliveryAddress = req.body.deliveryAddress;
    orderData.customerCharge = req.body.customerCharge;
    orderData.updateHistory = [
      {
        message: "full update",
        createdBy: req.user?.role === "admin" ? "admin" : req?.user?.name,
        time: req.body.time,
      },
    ];
    await orderData.save();

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to update order!",
      });
    }

    // update products stocks
    await Promise.all(orderData.products.map((product) => updateProductStock(product, -1)));

    return res.status(200).json({
      data: orderData,
      success: true,
      message: "Update order successfully.",
    });
  } catch (err) {
    console.log("*** orderController: UpdateOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ORDER FOR UPDATE
const fetchOrderForUpdate = async (req, res) => {
  try {
    const singleOrderData = await OrderModel.aggregate([
      {
        $match: {
          serialId: { $eq: req.params.serialId },
        },
      },
      ...orderQuery(orderProjection),
    ]);

    if (!singleOrderData[0]) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch order data!",
      });
    }

    const orderData = JSON.parse(JSON.stringify(singleOrderData[0]));

    // check order status meet with - delivery, cancel, return, refund
    let isCancel = false;
    orderData?.orderStatus.forEach((st) => {
      if (["CANCELED", "DELIVERED", "RETURNED", "REFUND"].includes(st?.status)) {
        isCancel = true;
      }
    });
    if (isCancel) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "This order couldn't be update!",
      });
    }

    const allProducts = [];
    await Promise.all(
      orderData?.products.map(async (prod) => {
        let prodStock = 0;
        prodStock = prod?.nonVariation?.stock;
        if (prod?.isVariant) {
          const variationData = await VariationModel.findOne({ _id: prod?.variationId });
          prodStock = variationData?.stock;
        }

        const obj = {
          uid: nanoid(),
          productId: prod?._id,
          slug: prod?.slug,
          name: prod?.name,
          isVariant: prod?.isVariant,
          variantId: prod?.variationId === null ? "" : prod?.variationId,
          variantName: prod?.variationName,
          quantity: prod?.quantity,
          price: prod?.price,
          subTotal: Number(prod?.quantity) * Number(prod?.price),
          images: prod?.galleryImage,
          sku: prod?.sku,
          stock: prodStock + prod.quantity,
          isOld: true,
        };

        allProducts.push(obj);
      })
    );

    orderData.products = allProducts;

    return res.status(200).json({
      data: orderData,
      message: "Fetch single order successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: fetchSingleOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ALL ORDERS
const fetchAllOrderByAdmin = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [];
    // if (req.body.status === "RETURNED" || req.body.status === "REFUND") {
    //   matchCondition.push({
    //     $eq: ["$orderStatus.status", req.body.status],
    //   });
    // } else
    if (req.body.status !== "ALL") {
      matchCondition.push({
        $eq: [{ $arrayElemAt: ["$orderStatus.status", -1] }, req.body.status],
      });
    }

    if (req.body.createdBy !== "ALL") {
      if (req.body.createdBy === "employee") {
        // matchCondition.push({
        //   $nin: ["$createdBy", ["admin", "customer", "visitor"]],
        // });
      } else {
        matchCondition.push({
          $eq: ["$createdBy", req.body.createdBy],
        });
      }
    }

    if (req.body.courier !== "") {
      matchCondition.push({
        $eq: ["$courierId", ObjectId(req.body.courier)],
      });
    }

    if (req.body.employee !== "") {
      matchCondition.push({
        $eq: ["$employeeId", ObjectId(req.body.employee)],
      });
    }

    if (req.body.startTime && req.body.endTime) {
      matchCondition.push({
        $gte: ["$createdAt", req.body.startTime],
      });
      matchCondition.push({
        $lte: ["$createdAt", req.body.endTime],
      });
    }

    // console.log("matchCondition: ", matchCondition);

    // return res.json({ matchCondition });
    const [orderData, totalData, statusCount] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: matchCondition,
            },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...orderQuery(orderProjection),
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      OrderModel.countDocuments({
        $expr: {
          $and: matchCondition,
        },
      }),
      OrderModel.aggregate([
        {
          $addFields: {
            statusName: { $arrayElemAt: ["$orderStatus.status", -1] },
          },
        },
        {
          $group: {
            _id: "$statusName",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      statusCount,
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: fetchAllOrderByAdmin ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ALL CUSTOMER ORDERS
const fetchAllCustomerOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const orderData = await OrderModel.aggregate([
      {
        $match: {
          customerId: ObjectId(req.params.customerId),
        },
      },
      ...orderQuery(orderProjection),
      {
        $sort: {
          createdAt: -1,
        },
      },
      pagination(page, pageLimit),
    ]);

    if (!orderData || orderData.length <= 0) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: orderData[0]?.metadata[0],
      data: orderData[0]?.data,
      message:
        orderData[0]?.data?.length <= 0 ? "No data found!" : "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: fetchAllCustomerOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ALL CUSTOMER ORDERS
const fetchAllCustomerPendingOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const orderData = await OrderModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: ["$customerId", ObjectId(req.params.customerId)],
              },
              {
                $ne: ["$_id", ObjectId(req.params.orderId)],
              },
            ],
          },
        },
      },
      ...orderQuery(orderProjection),
      {
        $sort: {
          createdAt: -1,
        },
      },
      pagination(page, pageLimit),
    ]);

    if (!orderData || orderData.length <= 0) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: orderData[0]?.metadata[0],
      data: orderData[0]?.data,
      message:
        orderData[0]?.data?.length <= 0 ? "No data found!" : "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: fetchAllCustomerOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE ORDERS
const fetchSingleOrder = async (req, res) => {
  try {
    const [orderData] = await OrderModel.aggregate([
      {
        $match: {
          serialId: { $eq: req.params.serialId },
        },
      },
      ...orderQuery(orderProjection),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch single order!",
      });
    }

    // if (req.user.role === "customer") {
    //   if (!orderData[0]?.customerId.equals(req.user._id)) {
    //     return res.status(200).json({
    //       data: null,
    //       message: "Unauthorized user!",
    //       success: true,
    //     });
    //   }
    // }

    return res.status(200).json({
      data: orderData,
      message: "Fetch single order successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: fetchSingleOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE ORDERS
const fetchMultipleOrder = async (req, res) => {
  try {
    const orderData = await OrderModel.aggregate([
      {
        $match: {
          serialId: { $in: req.body.serialIds },
        },
      },
      ...orderQuery(orderProjection),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch single order!",
      });
    }

    return res.status(200).json({
      data: orderData,
      message: "Fetch multiple order successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: fetchSingleOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// SEARCH ORDERS BY ADMIN
const searchOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      $or: [
        { "deliveryAddress.phone": { $regex: req.body.value, $options: "i" } },
        { serialId: { $regex: req.body.value, $options: "i" } },
      ],
    };

    const [orderData, totalData, statusCount] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: matchCondition,
        },
        ...orderQuery(orderProjection),
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      OrderModel.countDocuments(matchCondition),
      OrderModel.aggregate([
        {
          $addFields: {
            statusName: { $arrayElemAt: ["$orderStatus.status", -1] },
          },
        },
        {
          $group: {
            _id: "$statusName",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      statusCount,
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** orderController: searchOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {
    let avoidStatus = [];
    const { status, time, returnMoney } = req.body;

    if (
      status === "PENDING" ||
      status === "HOLD" ||
      status === "CONFIRM" ||
      status === "PROCESSING" ||
      status === "PICKED" ||
      status === "SHIPPED"
    ) {
      avoidStatus = ["CANCELED", "DELIVERED", "RETURNED", "REFUND"];
    } else if (status === "CANCELED") {
      avoidStatus = ["CANCELED", "DELIVERED", "RETURNED", "REFUND"];
    } else if (status === "RETURNED") {
      avoidStatus = ["RETURNED", "CANCELED"];
    }

    const checkOrderData = await OrderModel.findOne(
      {
        _id: req.params.orderId,
        "orderStatus.status": {
          $in: avoidStatus,
        },
      },
      { _id: 1, orderStatus: 1 }
    );

    if (checkOrderData) {
      return res.status(409).json({
        data: null,
        success: true,
        message: `Couldn't '${status.toLowerCase()}' the order!`,
      });
    }

    let orderData = null;
    if (status === "DELIVERED") {
      orderData = await OrderModel.findOneAndUpdate(
        { _id: req.params.orderId },
        [
          {
            $set: {
              "customerCharge.totalPayTk": { $sum: ["$customerCharge.TotalBill", 0] },
              "customerCharge.remainingTkPay": 0,
              adminRevenue: { $sum: ["$customerCharge.TotalBill", 0] },
              "payment.amount": { $sum: ["$customerCharge.TotalBill", 0] },
              orderStatus: {
                $concatArrays: [
                  "$orderStatus",
                  [
                    {
                      status,
                      time,
                      changeBy: req.user.role === "admin" ? "admin" : req.user.name,
                      employeeId: req.user.role === "admin" ? null : req.user._id,
                      _id: ObjectId(),
                    },
                  ],
                ],
              },
            },
          },
        ],
        {
          new: true,
        }
      );

      const productStockData = [];
      const disPrice = orderData?.customerCharge?.discountPrice;
      const totalQty = orderData.products.reduce((prev, cur) => prev + cur.quantity, 0);

      orderData.products.forEach((productData) => {
        const obj = {
          productId: productData?.productId,
          variationId: productData?.variationId,
          isVariant: productData?.isVariant,
          quantity: productData?.quantity,
          price: productData.price - disPrice / totalQty,
        };

        productStockData.push(obj);
      });

      await Promise.all(
        productStockData.map(async (prodStockData) => {
          if (prodStockData?.isVariant) {
            await VariationModel.findOneAndUpdate(
              { _id: prodStockData?.variationId },
              {
                $inc: {
                  sellQty: prodStockData?.quantity || 0,
                  totalSellPrice: prodStockData.quantity * prodStockData.price || 0,
                },
              },
              { new: true }
            );
          } else {
            await ProductModel.findOneAndUpdate(
              { _id: prodStockData?.productId },
              {
                $inc: {
                  "nonVariation.sellQty": prodStockData?.quantity || 0,
                  "nonVariation.totalSellPrice": prodStockData.quantity * prodStockData.price || 0,
                },
              },
              { new: true }
            );
          }
        })
      );
    } else {
      orderData = await OrderModel.findOneAndUpdate(
        { _id: req.params.orderId },
        {
          $set: {
            returnMoney,
            isReturn: status === "RETURNED",
          },
          $push: {
            orderStatus: {
              status,
              time,
              changeBy: req.user.role === "admin" ? "admin" : req.user.name,
              employeeId: req.user.role === "admin" ? null : req.user._id,
            },
          },
        },
        { new: true }
      );
    }

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to ${status} order!`,
      });
    }

    if (status === "CANCELED" || status === "RETURNED") {
      await Promise.all(orderData.products.map((product) => updateProductStock(product, 1)));
    }

    // let message = "";

    // if (status === "PENDING") {
    //   message = pendingOrderMsg(orderData?.serialId, orderData?.customerCharge?.remainingTkPay);
    // } else if (status === "CONFIRM") {
    //   message = confirmOrderMsg(orderData?.serialId, orderData?.customerCharge?.remainingTkPay);
    // } else if (status === "HOLD") {
    //   message = holdOrderMsg(orderData?.serialId);
    // } else if (status === "CANCELED") {
    //   message = cancelOrderMsg(orderData?.serialId);
    // }

    // if (message !== "") {
    //   try {
    //     await smsSend(orderData?.deliveryAddress?.phone, message);
    //   } catch (err) {
    //     // return res.status(426).json({
    //     //   data: null,
    //     //   success: false,
    //     //   message: err?.message,
    //     // });
    //   }
    // }

    return res.status(200).json({
      data: orderData,
      success: true,
      message: `'${status}' the order successfully.`,
    });
  } catch (err) {
    console.log("*** orderController: updateOrderStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE ORDER STATUS
const updateMultipleOrderStatus = async (req, res) => {
  try {
    if (req.body.status === "DELIVERED") {
      await OrderModel.updateMany(
        { _id: { $in: req.body.orders } },
        [
          {
            $set: {
              "customerCharge.totalPayTk": { $sum: ["$customerCharge.TotalBill", 0] },
              "customerCharge.remainingTkPay": 0,
              adminRevenue: { $sum: ["$customerCharge.TotalBill", 0] },
              "payment.amount": { $sum: ["$customerCharge.TotalBill", 0] },
              orderStatus: {
                $concatArrays: [
                  "$orderStatus",
                  [
                    {
                      status: req.body.status,
                      time: req.body.time,
                      changeBy: req.user.role === "admin" ? "admin" : req.user.name,
                      employeeId: req.user.role === "admin" ? null : req.user._id,
                      _id: ObjectId(),
                    },
                  ],
                ],
              },
            },
          },
        ],
        {
          new: true,
        }
      );
    } else {
      await OrderModel.updateMany(
        { _id: { $in: req.body.orders } },
        {
          $push: {
            orderStatus: {
              status: req.body.status,
              time: req.body.time,
              changeBy: req.user.role === "admin" ? "admin" : req.user.name,
              employeeId: req.user.role === "admin" ? null : req.user._id,
            },
          },
        },
        { new: true }
      );
    }

    const allOrderData = await OrderModel.find({ _id: { $in: req.body.orders } });

    if (!allOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to ${req.body.status} order!`,
      });
    }

    if (req.body.status === "DELIVERED") {
      const allProductStockData = [];
      allOrderData.forEach((orderDetails) => {
        const disPrice = orderDetails?.customerCharge?.discountPrice;
        const totalQty = orderDetails.products.reduce((prev, cur) => prev + cur.quantity, 0);

        orderDetails.products.forEach((productData) => {
          const obj = {
            productId: productData?.productId,
            variationId: productData?.variationId,
            isVariant: productData?.isVariant,
            quantity: productData?.quantity,
            price: productData.price - disPrice / totalQty,
          };

          allProductStockData.push(obj);
        });
      });

      await Promise.all(
        allProductStockData.map(async (prodStockData) => {
          if (prodStockData?.isVariant) {
            await VariationModel.findOneAndUpdate(
              { _id: prodStockData?.variationId },
              {
                $inc: {
                  sellQty: prodStockData?.quantity || 0,
                  totalSellPrice: prodStockData.quantity * prodStockData.price || 0,
                },
              },
              { new: true }
            );
          } else {
            await ProductModel.findOneAndUpdate(
              { _id: prodStockData?.productId },
              {
                $inc: {
                  "nonVariation.sellQty": prodStockData?.quantity || 0,
                  "nonVariation.totalSellPrice": prodStockData.quantity * prodStockData.price || 0,
                },
              },
              { new: true }
            );
          }
        })
      );
    }

    if (req.body.status === "CANCELED" || req.body.status === "RETURNED") {
      allOrderData.forEach(async (orderData) => {
        await Promise.all(orderData.products.map((product) => updateProductStock(product, 1)));
      });
    }

    const msgArray = [];

    allOrderData.forEach((ord) => {
      msgArray.push({
        serialId: ord?.serialId,
        phone: ord?.deliveryAddress?.phone,
        dueTk: ord?.customerCharge?.remainingTkPay,
      });
    });

    // const { status } = req.body;
    // if (msgArray.length > 0) {
    //   try {
    //     await Promise.all(
    //       msgArray.map((data) => {
    //         let message = "";
    //         if (status === "PENDING") {
    //           message = pendingOrderMsg(data?.serialId, data?.dueTk);
    //         } else if (status === "CONFIRM") {
    //           message = confirmOrderMsg(data?.serialId, data?.dueTk);
    //         } else if (status === "HOLD") {
    //           message = holdOrderMsg(data?.serialId);
    //         } else if (status === "CANCELED") {
    //           message = cancelOrderMsg(data?.serialId);
    //         }
    //         return smsSend(data?.phone, message);
    //       })
    //     );
    //   } catch (err) {
    //     // return res.status(426).json({
    //     //   data: null,
    //     //   success: false,
    //     //   message: err?.message,
    //     // });
    //   }
    // }

    return res.status(200).json({
      data: allOrderData,
      success: true,
      message: `'${req.body.status}' the order successfully.`,
    });
  } catch (err) {
    console.log("*** orderController: updateOrderStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE ORDER ADVANCE PAYMENT
const updateOrderPaymentInfo = async (req, res) => {
  try {
    const orderData = await OrderModel.findOne({ _id: req.params.orderId });

    let docImgUrl = "";
    if (req.body.documentImg) {
      const isNewImage = req.body.documentImg.substring(0, 6);
      if (isNewImage !== "public") {
        docImgUrl = uploadImage(req.body.documentImg, "public/order/");
        if (orderData?.payment?.documentImg) {
          deleteFile(orderData?.payment?.documentImg);
        }
      } else {
        docImgUrl = req.body.documentImg;
      }
    } else if (!req.body.documentImg && orderData?.payment?.documentImg) {
      deleteFile(orderData?.payment?.documentImg);
    }

    const updateOrderData = await OrderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
      },
      {
        $set: {
          "customerCharge.deliveryCharge": req.body.deliveryCharge,
          "customerCharge.discountPrice": req.body.discountPrice,
          "customerCharge.totalPayTk": req.body.amount,
          "payment.paymentType": req.body.paymentType,
          "payment.amount": req.body.amount,
          "payment.details": req.body.details,
          "payment.documentImg": docImgUrl,
        },
        $push: {
          updateHistory: {
            message: "payment update",
            createdBy: req.user?.role === "admin" ? "admin" : req?.user?.name,
            time: req.body.time,
          },
        },
      },
      {
        new: true,
      }
    );

    await updateOrderData.save();

    if (!updateOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to update order payment!`,
      });
    }

    return res.status(200).json({
      data: updateOrderData,
      success: true,
      message: "Order payment updated successfully.",
    });
  } catch (err) {
    console.log("*** orderController: updateOrderStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE ORDER's CUSTOMER ADDRESS
const updateOrderCustomerAddress = async (req, res) => {
  try {
    const updateOrderData = await OrderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
      },
      {
        $set: {
          "deliveryAddress.address": req.body.address,
        },
        $push: {
          updateHistory: {
            message: "customer address",
            createdBy: req.user?.role === "admin" ? "admin" : req?.user?.name,
            time: req.body.time,
          },
        },
      },
      {
        new: true,
      }
    );

    if (!updateOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to update order address!`,
      });
    }

    return res.status(200).json({
      data: updateOrderData,
      success: true,
      message: "Order address updated successfully.",
    });
  } catch (err) {
    console.log("*** orderController: updateOrderStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ADD ORDER NOTE
const addAdminNote = async (req, res) => {
  try {
    const orderData = await OrderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
      },
      {
        $push: {
          adminNote: {
            $each: [
              {
                message: req.body.note,
                createdBy: req.user?.role === "admin" ? "admin" : req?.user?.name,
                time: req.body.time,
              },
            ],
            $position: 0,
          },
        },
      },
      {
        new: true,
      }
    );

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to add note!`,
      });
    }

    return res.status(200).json({
      data: orderData?.adminNote,
      success: true,
      message: "Add note successfully.",
    });
  } catch (err) {
    console.log("*** orderController: updateOrderStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE COURIER
const updateCourier = async (req, res) => {
  try {
    const orderData = await OrderModel.findOneAndUpdate(
      {
        _id: req.params.orderId,
      },
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: `Failed to update courier!`,
      });
    }

    return res.status(200).json({
      data: orderData,
      success: true,
      message: "Courier updated successfully.",
    });
  } catch (err) {
    console.log("*** orderController: updateOrderStatus ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const orderInvoiceDownload = async (req, res) => {
  try {
    const orderData = await OrderModel.aggregate([
      {
        $match: {
          _id: ObjectId(req.params.orderId),
        },
      },
      ...orderQuery(orderProjection),
      {
        $lookup: {
          from: "settings",
          pipeline: [
            {
              $project: {
                address: 1,
                shopName: 1,
                phone: 1,
                email: 1,
                logoImg: 1,
              },
            },
          ],
          as: "settingsData",
        },
      },
      {
        $unwind: {
          path: "$settingsData",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch single order!",
      });
    }

    const path = `${"public/invoice/single_"}${nanoid(7)}.pdf`;
    createOrderInvoice(orderData[0], path);

    return res.status(200).json({
      data: path,
      success: true,
      message: "Invoice Download successfully.",
    });
  } catch (err) {
    console.log("*** orderController: orderInvoiceDownload ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const returnRefundOrder = async (req, res) => {
  try {
    const orderData = await OrderModel.findOne({ _id: req.params.orderId });

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch single order!",
      });
    }

    let isAllow = false;
    orderData?.orderStatus.forEach((st) => {
      // if (["DELIVERED", "RETURNED", "REFUND"].includes(st?.status)) {
      if (["DELIVERED"].includes(st?.status)) {
        isAllow = true;
      }
    });

    if (!isAllow) {
      return res.status(409).json({
        data: null,
        success: false,
        message: "This order could not be processed!",
      });
    }

    if (Number(req.body.refundMoney) === 0) {
      if (orderData?.isRefund) {
        orderData.orderStatus = orderData?.orderStatus.filter((i) => i?.status !== "REFUND");
      }
      orderData.isRefund = false;
      orderData.refundMoney = 0;
    } else {
      if (!orderData?.isRefund) {
        orderData.orderStatus.push({
          status: "REFUND",
          time: new Date(),
          changeBy: req.user.role === "admin" ? "admin" : req.user.name,
          employeeId: req.user.role === "admin" ? null : req.user._id,
        });
      }

      orderData.isRefund = true;
      orderData.refundMoney = Number(req.body.refundMoney);
    }

    let isReturn = false;
    req.body.products.forEach((i) => {
      if (i?.returnQty !== 0) {
        isReturn = true;
      }
    });

    if (!isReturn) {
      if (orderData?.isReturn) {
        orderData.orderStatus = orderData?.orderStatus.filter((i) => i?.status !== "RETURNED");
      }
      orderData.isReturn = false;
    } else {
      if (!orderData?.isReturn) {
        orderData.orderStatus.push({
          status: "RETURNED",
          time: new Date(),
          changeBy: req.user.role === "admin" ? "admin" : req.user.name,
          employeeId: req.user.role === "admin" ? null : req.user._id,
        });
      }
      orderData.isReturn = true;
    }

    const updateOrderProducs = [];
    const orderProducts = JSON.parse(JSON.stringify(orderData.products));
    orderProducts.forEach((oldProd) => {
      const obj = { ...oldProd };
      req.body.products.forEach((newProd) => {
        if (
          newProd?.productId === oldProd?.productId &&
          newProd?.variationId === oldProd?.variationId
        ) {
          obj.returnQty = newProd.returnQty;
        }
      });
      updateOrderProducs.push(obj);
    });

    orderData.products = updateOrderProducs;
    orderData.returnMoney = req.body.returnMoney;
    await orderData.save();

    orderProducts.forEach((oldProd) => {
      req.body.products.forEach(async (newProd) => {
        if (
          newProd?.productId === oldProd?.productId &&
          newProd?.variationId === oldProd?.variationId
        ) {
          const stockBalance = newProd.returnQty - oldProd.returnQty || 0;

          updateProductReturnStock(oldProd, stockBalance);
        }
      });
    });

    return res.status(200).json({
      data: orderData,
      success: true,
      message: "Update order refund return process successfully.",
    });
  } catch (err) {
    console.log("*** orderController: returnRefundOrder ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const test = async (req, res) => {
  console.log("hi");

  return res.json({ msg: "hi" });
};

module.exports = {
  createCustomerOrder,
  createPosOrder,
  UpdateOrder,
  fetchOrderForUpdate,
  fetchAllOrderByAdmin,
  fetchAllCustomerOrder,
  fetchAllCustomerPendingOrder,
  fetchSingleOrder,
  fetchMultipleOrder,

  searchOrder,
  updateOrderStatus, // pending, cancel confirm, process, picked, shipped, delivered
  updateMultipleOrderStatus,
  updateOrderCustomerAddress,
  orderInvoiceDownload,

  updateOrderPaymentInfo,
  addAdminNote,
  updateCourier,
  returnRefundOrder,

  test,
};
