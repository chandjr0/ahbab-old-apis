const bcrypt = require("bcryptjs");

const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const OrderModel = require("../../models/order/order");
const CustomerModel = require("../../models/user/customer");
const orderQuery = require("../../helpers/orderQuery");
const { promoVerify } = require("../../helpers/promoQuery");
const customMetaData = require("../../helpers/customMetaData");
const { updateProductStock, checkProductForOrder } = require("../../helpers/productQuery");
const { orderSerialNumber } = require("../../helpers/shareFunc");

const uploadImage = require("../../utils/upload-img");
const { pendingOrderMsg } = require("../../service/smsList");
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

// ================ ADMIN CUSTOMER ORDER ==============
// CREATE CUSTOMER ORDER
const createAdminCustomerOrder = async (req, res) => {
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

    const message = pendingOrderMsg(orderData?.serialId);
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

// FETCH ALL CUSTOMER ORDERS
const fetchAllAdminCustomerOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [orderData, totalData] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            customerId: ObjectId(req.params.customerId),
            resellerId: null,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...orderQuery(orderProjection),
      ]),
      OrderModel.countDocuments({
        customerId: ObjectId(req.params.customerId),
      }),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch all orders successfully.",
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

// ================ RESELLER CUSTOMER ORDER ==============
// CREATE CUSTOMER ORDER
const createResellerCustomerOrder = async (req, res) => {
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
      orderStatus: [{ status: "PENDING", time: new Date(), changeBy: req.user.role }],
      payment: req.body.payment,
      paymentHistory: [{ amount: req.body.customerCharge.totalPayTk }],
      deliveryAddress: req.body.deliveryAddress,
      customerCharge: req.body.customerCharge,
      createdBy: req.user.role,
      resellerId: req.reseller._id,
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

// FETCH ALL CUSTOMER ORDERS
const fetchAllResellerCustomerOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [orderData, totalData] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            customerId: ObjectId(req.params.customerId),
            resellerId: req.reseller._id,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...orderQuery(orderProjection),
      ]),
      OrderModel.countDocuments({
        customerId: ObjectId(req.params.customerId),
      }),
    ]);

    if (!orderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: orderData,
      message: "Fetch all orders successfully.",
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

module.exports = {
  // ADMIN
  createAdminCustomerOrder,
  fetchAllAdminCustomerOrder,
  fetchSingleOrder,

  // RESELLER
  createResellerCustomerOrder,
  fetchAllResellerCustomerOrder,
};
