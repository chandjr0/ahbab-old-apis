const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");

const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const ResellerModel = require("../../models/user/reseller");
const OrderModel = require("../../models/order/order");
const CustomerModel = require("../../models/user/customer");
const orderQuery = require("../../helpers/orderQuery");
const customMetaData = require("../../helpers/customMetaData");
const { updateProductStock, checkProductForOrder } = require("../../helpers/productQuery");
const { orderSerialNumber } = require("../../helpers/shareFunc");
const uploadImage = require("../../utils/upload-img");
const createOrderInvoice = require("../../invoices/orderInvoice").createInvoiceSingle;
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

// CREATE POS ORDER
const createPosOrderByReseller = async (req, res) => {
  try {
    // return res.json({ data: req.body });
    const checkReseller = await ResellerModel.findOne({
      _id: req.user._id,
      status: "active",
    });

    if (!checkReseller) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Inactive reseller couldn't create order",
      });
    }

    if (req.body.customerId) {
      const isExistCustomer = await CustomerModel.findOne({
        _id: req.body.customerId,
        resellerId: req.user._id,
      });
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
        resellerId: req.user._id,
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
          resellerId: req.user._id,
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
          status: "PENDING",
          time: new Date().toISOString(),
          changeBy: req.user.role,
          employeeId: null,
        },
      ],
      // courierName: req.body.courierName,
      payment: req.body.payment,
      paymentHistory: [{ amount: req.body.customerCharge.totalPayTk }],
      deliveryAddress: req.body.deliveryAddress,
      customerCharge: req.body.customerCharge,
      employeeId: null,
      createdBy: "reseller",
      createdAt: req.body.time,
      resellerId: req.user._id,
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

// FETCH ALL ORDERS
const fetchAllOrderReseller = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        $eq: ["$resellerId", ObjectId(req.user._id)],
      },
    ];

    if (req.body.status !== "ALL") {
      matchCondition.push({
        $eq: [{ $arrayElemAt: ["$orderStatus.status", -1] }, req.body.status],
      });
    }

    if (req.body.createdBy !== "ALL") {
      matchCondition.push({
        $eq: ["$createdBy", req.body.createdBy],
      });
    }

    if (req.body.courier !== "") {
      matchCondition.push({
        $eq: ["$courierId", ObjectId(req.body.courier)],
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
          $match: {
            resellerId: ObjectId(req.user._id),
          },
        },
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
    console.log("*** orderController: fetchAllOrderReseller ***");
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
          $and: [
            {
              serialId: { $eq: req.params.serialId },
            },
            {
              resellerId: { $eq: ObjectId(req.user._id) },
            },
          ],
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
          $and: [
            {
              serialId: { $eq: req.params.serialId },
            },
            {
              resellerId: { $eq: ObjectId(req.user._id) },
            },
          ],
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
      $and: [
        {
          $or: [
            { "deliveryAddress.phone": { $regex: req.body.value, $options: "i" } },
            { serialId: { $regex: req.body.value, $options: "i" } },
          ],
        },
        {
          resellerId: { $eq: ObjectId(req.user._id) },
        },
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

module.exports = {
  createPosOrderByReseller,
  fetchAllOrderReseller,
  searchOrder,
  fetchSingleOrder,
  fetchMultipleOrder,
  orderInvoiceDownload,
};
