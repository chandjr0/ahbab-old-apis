const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const ResellerOrderModel = require("../../models/resellerOrder/resellerOrder");
const ResellerPaymentModel = require("../../models/resellerPayment/resellerPayment");
const ResellerModel = require("../../models/user/reseller");
const LogModel = require("../../models/helpers/log");
const customMetaData = require("../../helpers/customMetaData");
const { getResellerPaymentSerial } = require("../../helpers/shareFunc");
const {
  resellerOrderPaymentAdminPopulate,
  resellerOrderPopulate,
} = require("../../helpers/allOrderQuery");
const uploadImage = require("../../utils/upload-img");

const orderProjection = {
  serialId: 1,
  customerId: 1,
  products: 1,
  resellerStatus: 1,
  orderStatus: 1,
  resellerNote: 1,
  customerNote: 1,
  payment: 1,
  deliveryAddress: 1,
  customerCharge: 1,
  deliverySiteCost: 1,
  adminRevenue: 1,
  createdBy: 1,
  createdAt: 1,
  isReturn: 1,
  isRefund: 1,
  updateHistory: 1,
  courierData: 1,
  courierInfo: 1,
  resellerInfo: 1,
};

// PENDING RESELLER PAYMENT LIST
const pendingResellerPaymentList = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        $eq: [{ $arrayElemAt: ["$orderStatus.status", -1] }, "DELIVERED"],
      },
      {
        $in: ["$resellerPayStatus", ["", "cancel"]],
      },
      // {
      //   $eq: ["$orderPayStatus", "paid"],
      // },
    ];

    if (req.body.value !== "") {
      const resellerData = await ResellerModel.findOne(
        {
          phone: req.body.value,
        },
        {
          _id: 1,
        }
      );

      if (resellerData) {
        matchCondition.push({
          $eq: ["$resellerInfo.resellerId", ObjectId(resellerData?._id)],
        });
      }
    }

    const [resellerList, [{ totalData } = {}]] = await Promise.all([
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: matchCondition,
            },
          },
        },
        {
          $group: {
            _id: "$resellerInfo.resellerId",
            resellerId: { $first: "$resellerInfo.resellerId" },
            totalProfitMoney: { $first: "$resellerInfo.profitMoney" },
            totalAdvanceMoney: { $first: "$resellerInfo.advanceMoney" },
            totalGrandProfit: { $first: "$resellerInfo.grandProfit" },
            totalOrder: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "resellers",
            localField: "resellerId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  phone: 1,
                  email: 1,
                  website: 1,
                },
              },
            ],
            as: "reseller",
          },
        },
        {
          $unwind: {
            path: "$reseller",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            resellerId: 0,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: matchCondition,
            },
          },
        },
        {
          $group: {
            _id: "$resellerInfo.resellerId",
          },
        },
        {
          $group: {
            _id: null,
            totalData: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!resellerList) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch list!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: resellerList,
      message: "Fetch pending reseller successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerPaymentController: pendingResellerPaymentList ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// PENDING RESELLER ORDERS
const pendingResellerOrders = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      $expr: {
        $and: [
          {
            $eq: [{ $arrayElemAt: ["$orderStatus.status", -1] }, "DELIVERED"],
          },
          {
            $in: ["$resellerPayStatus", ["", "cancel"]],
          },
          // {
          //   $eq: ["$orderPayStatus", "paid"],
          // },
          {
            $eq: ["$resellerInfo.resellerId", ObjectId(req.params.resellerId)],
          },
        ],
      },
    };

    const [resellerList, [{ totalData } = {}], resellerData] = await Promise.all([
      ResellerOrderModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...resellerOrderPopulate,
        {
          $project: orderProjection,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: null,
            totalData: { $sum: 1 },
          },
        },
      ]),
      ResellerModel.findOne(
        {
          _id: ObjectId(req.params.resellerId),
        },
        {
          serialId: 1,
          name: 1,
          phone: 1,
          email: 1,
          image: 1,
        }
      ),
    ]);

    if (!resellerList) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch list!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      resellerData,
      data: resellerList,
      message: "Fetch pending reseller successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerPaymentController: pendingResellerOrders ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// PENDING RESELLER ORDERS
const pendingOrderOfReseller = async (req, res) => {
  try {
    // await ResellerOrderModel.updateMany(
    //   {},
    //   {
    //     $set: {
    //       returnDetails: {
    //         isResellerReturnClaim: false,
    //         isDone: false,
    //         returnMoney: 0,
    //       },
    //       resellerPayStatus: "",
    //     },
    //     $unset: {
    //       isResellerReturnClaim: 1,
    //     },
    //   },
    //   { multi: true }
    // );

    // return res.json({ msg: "hi" });
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        $or: [
          {
            $eq: [{ $arrayElemAt: ["$orderStatus.status", -1] }, "DELIVERED"],
          },
          {
            $and: [
              {
                $eq: [{ $arrayElemAt: ["$orderStatus.status", -1] }, "RETURNED"],
              },
              {
                $eq: ["$returnDetails.isDone", true],
              },
            ],
          },
        ],
      },
      {
        $in: ["$resellerPayStatus", ["", "cancel"]],
      },
      // {
      //   $eq: ["$orderPayStatus", "paid"],
      // },
      {
        $eq: ["$resellerInfo.resellerId", ObjectId(req.body.resellerId)],
      },
    ];

    if (req.body.startTime && req.body.endTime) {
      matchCondition.push({
        $gte: [{ $arrayElemAt: ["$orderStatus.time", -1] }, req.body.startTime],
      });
      matchCondition.push({
        $lte: [{ $arrayElemAt: ["$orderStatus.time", -1] }, req.body.endTime],
      });
    }

    const [resellerList, [{ totalData } = {}]] = await Promise.all([
      ResellerOrderModel.aggregate([
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
        ...resellerOrderPaymentAdminPopulate,
        {
          $project: orderProjection,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: matchCondition,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalData: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!resellerList) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch list!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      // resellerData,
      data: resellerList,
      message: "Fetch pending reseller successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerPaymentController: pendingResellerOrders ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// MAKE PAYMENT INVOICE
const makePaymentInvoice = async (req, res) => {
  try {
    const checkOrders = await ResellerOrderModel.findOne({
      $expr: {
        $and: [
          {
            $in: ["$_id", req.body.orderIds.map((i) => ObjectId(i))],
          },
          {
            $eq: ["$resellerInfo.resellerId", ObjectId(req.params.resellerId)],
          },
          {
            $or: [
              {
                $in: ["$resellerPayStatus", ["pending", "confirm"]],
              },
              {
                $in: [
                  { $arrayElemAt: ["$orderStatus.status", -1] },
                  ["CANCELED", "PENDING", "CONFIRM", "SHIPPED"],
                ],
              },
              // {
              //   $ne: ["$orderPayStatus", "paid"],
              // },
            ],
          },
        ],
      },
    });

    if (checkOrders) {
      return res.status(400).json({
        data: null,
        message: "There is some invalid orders!",
        success: false,
      });
    }

    // return res.json({ checkOrders });

    // calculate payment by order details
    const [profitData] = await ResellerOrderModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              {
                $in: ["$_id", req.body.orderIds.map((i) => ObjectId(i))],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalProfitMoney: { $sum: "$resellerInfo.profitMoney" },
          totalAdvanceMoney: { $sum: "$resellerInfo.advanceMoney" },
          totalGrandProfit: { $sum: "$resellerInfo.grandProfit" },
        },
      },
    ]);

    // upload files img
    const filesImgs = req.body.files.map((img) => uploadImage(img, "public/reseller/"));

    const paymentInfo = {
      totalProfitMoney: profitData?.totalProfitMoney,
      totalAdvanceMoney: profitData?.totalAdvanceMoney,
      totalGrandProfit: profitData?.totalGrandProfit,
    };
    const obj = {
      serialId: await getResellerPaymentSerial(),
      resellerId: req.params.resellerId,
      orderIds: req.body.orderIds,
      paymentInfo,
      details: req.body.details,
      files: filesImgs,
      status: "pending",
      employeeId: req.user.role === "admin" ? null : req.user._id,
      createdBy: req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`,
    };
    const resellerPaymentData = await ResellerPaymentModel.create(obj);

    if (!resellerPaymentData) {
      return res.status(400).json({
        data: null,
        message: "Failed to make invoice for reseller!",
        success: false,
      });
    }

    // update  to all orders
    await Promise.all([
      ResellerOrderModel.updateMany(
        {
          _id: { $in: req.body.orderIds.map((i) => ObjectId(i)) },
        },
        {
          $set: {
            resellerPayStatus: "pending",
          },
        },
        { multi: true }
      ),
      LogModel.insertMany(
        req.body.orderIds.map((i) => ({
          referObjectId: ObjectId(i),
          message: `${
            req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`
          } make payment invoice.`,
          time: new Date().toISOString(),
        }))
      ),
    ]);

    return res.status(200).json({
      data: resellerPaymentData,
      message: "Make invoice for reseller successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerPaymentController: makePaymentInvoice ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// RESELLER INVOICE LIST
const resellerInvoiceList = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [];

    if (req.body.status !== "all") {
      matchCondition.push({
        status: req.body.status,
      });
    }

    if (req.body.value !== "") {
      const orCondition = [];
      orCondition.push({
        serialId: { $regex: req.body.value, $options: "i" },
      });

      const resellerData = await ResellerModel.findOne({
        $or: [
          {
            phone: req.body.value,
          },
          {
            email: req.body.value,
          },
          {
            name: { $regex: req.body.value, $options: "i" },
          },
        ],
      });

      if (resellerData) {
        orCondition.push({
          resellerId: resellerData?._id,
        });
      }

      matchCondition.push({
        $or: orCondition,
      });
    }

    const [resellerList, [{ totalData } = {}], [resellerPaymentData]] = await Promise.all([
      ResellerPaymentModel.aggregate([
        {
          $match: matchCondition.length > 0 ? { $and: matchCondition } : {},
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: "resellers",
            localField: "resellerId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  phone: 1,
                  email: 1,
                  website: 1,
                },
              },
            ],
            as: "reseller",
          },
        },
        {
          $unwind: {
            path: "$reseller",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ResellerPaymentModel.aggregate([
        {
          $match: matchCondition.length > 0 ? { $and: matchCondition } : {},
        },
        {
          $group: {
            _id: null,
            totalData: { $sum: 1 },
          },
        },
      ]),
      ResellerPaymentModel.aggregate([
        {
          $match: matchCondition.length > 0 ? { $and: matchCondition } : {},
        },
        {
          $group: {
            _id: null,
            totalProfitMoney: { $sum: "$paymentInfo.totalProfitMoney" },
            totalAdvanceMoney: { $sum: "$paymentInfo.totalAdvanceMoney" },
            totalGrandProfit: { $sum: "$paymentInfo.totalGrandProfit" },
            totalOrder: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!resellerList) {
      return res.status(400).json({
        data: null,
        message: "Failed to make invoice for reseller!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      resellerPaymentData,
      data: resellerList,
      message: "Make invoice for reseller successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerPaymentController: resellerInvoiceList ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// RESELLER INVOICE VIEW
const resellerInvoiceView = async (req, res) => {
  try {
    const [resellerPayData] = await ResellerPaymentModel.aggregate([
      {
        $match: {
          serialId: req.params.serialId,
        },
      },
      {
        $lookup: {
          from: "resellers",
          localField: "resellerId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                phone: 1,
                email: 1,
                website: 1,
              },
            },
          ],
          as: "reseller",
        },
      },
      {
        $unwind: {
          path: "$reseller",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "reseller_orders",
          localField: "orderIds",
          foreignField: "_id",
          pipeline: [
            ...resellerOrderPopulate,
            {
              $project: orderProjection,
            },
          ],
          as: "orderData",
        },
      },
    ]);

    if (!resellerPayData) {
      return res.status(400).json({
        data: null,
        message: "Failed to view!",
        success: false,
      });
    }

    return res.status(200).json({
      data: resellerPayData,
      message: "View reseller pay successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerPaymentController: resellerInvoiceView ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// STATUS: RESELLER INVOICE
const updateResellerInvoiceStatus = async (req, res) => {
  try {
    const resellerPayData = await ResellerPaymentModel.findOne({
      _id: req.params.invoiceId,
    });

    if (!resellerPayData) {
      return res.status(400).json({
        data: resellerPayData,
        message: "Failed to update status!",
        success: false,
      });
    }

    if (["confirm", "cancel"].includes(resellerPayData?.status)) {
      return res.status(400).json({
        data: resellerPayData,
        message: `Failed to update status. Invoice status already is ${resellerPayData?.status}.`,
        success: false,
      });
    }

    resellerPayData.status = req.body.status;
    await resellerPayData.save();

    await ResellerOrderModel.updateMany(
      {
        _id: {
          $in: resellerPayData?.orderIds,
        },
      },
      {
        $set: {
          resellerPayStatus: req.body.status,
        },
      },
      {
        multi: true,
      }
    );

    return res.status(200).json({
      data: resellerPayData,
      message: "Update invoice successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerPaymentController: resellerInvoiceView ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// -------------- reseller ------------

// RESELLER INVOICE LIST BY RESELLER
const resellerInvoiceListByReseller = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        resellerId: ObjectId(req.user._id),
      },
    ];

    if (req.body.status !== "all") {
      matchCondition.push({
        status: req.body.status,
      });
    }

    if (req.body.value !== "") {
      matchCondition.push({
        serialId: { $regex: req.body.value, $options: "i" },
      });
    }

    const [resellerList, [{ totalData } = {}], [resellerPaymentData]] = await Promise.all([
      ResellerPaymentModel.aggregate([
        {
          $match: {
            $and: matchCondition,
          },
        },
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
      ResellerPaymentModel.aggregate([
        {
          $match: {
            $and: matchCondition,
          },
        },
        {
          $group: {
            _id: null,
            totalData: { $sum: 1 },
          },
        },
      ]),
      ResellerPaymentModel.aggregate([
        {
          $match: {
            $and: matchCondition,
          },
        },
        {
          $group: {
            _id: null,
            totalProfitMoney: { $sum: "$paymentInfo.totalProfitMoney" },
            totalAdvanceMoney: { $sum: "$paymentInfo.totalAdvanceMoney" },
            totalGrandProfit: { $sum: "$paymentInfo.totalGrandProfit" },
            totalOrder: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!resellerList) {
      return res.status(400).json({
        data: null,
        message: "Failed to make invoice for reseller!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      resellerPaymentData,
      data: resellerList,
      message: "Make invoice for reseller successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerPaymentController: resellerInvoiceList ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// RESELLER INVOICE VIEW BY RESELLER
const resellerInvoiceViewByReseller = async (req, res) => {
  try {
    const [resellerPayData] = await ResellerPaymentModel.aggregate([
      {
        $match: {
          serialId: req.params.serialId,
        },
      },
      {
        $lookup: {
          from: "reseller_orders",
          localField: "orderIds",
          foreignField: "_id",
          pipeline: [
            ...resellerOrderPopulate,
            {
              $project: orderProjection,
            },
          ],
          as: "orderData",
        },
      },
    ]);

    if (!resellerPayData) {
      return res.status(400).json({
        data: null,
        message: "Failed to view!",
        success: false,
      });
    }

    return res.status(200).json({
      data: resellerPayData,
      message: "View reseller pay successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** resellerPaymentController: resellerInvoiceView ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  // reseller invoice: admin
  pendingResellerPaymentList,
  pendingResellerOrders,
  pendingOrderOfReseller,
  makePaymentInvoice,
  resellerInvoiceList,
  resellerInvoiceView,
  updateResellerInvoiceStatus,

  // RESELLER
  resellerInvoiceListByReseller,
  resellerInvoiceViewByReseller,
};
