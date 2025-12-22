const mongoose = require("mongoose");
const AdminOrderModel = require("../../models/adminOrder/adminOrder");
const AdminOrderProductsModel = require("../../models/adminOrder/adminOrderProducts");
const ResellerOrderModel = require("../../models/resellerOrder/resellerOrder");
const ResellerOrderProductsModel = require("../../models/resellerOrder/resellerOrderProducts");
const ProductModel = require("../../models/product/product");
const CustomerModel = require("../../models/user/customer");
const ExpenseModel = require("../../models/expense/expense");
const PurchaseModel = require("../../models/purchase/purchase");
const ResellerModel = require("../../models/user/reseller");
const customMetaData = require("../../helpers/customMetaData");

const { ObjectId } = mongoose.Types;

const adminOrderHistoryByAdmin = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    let createOrderCondition = {};
    let matchCondition = {};

    let purchaseMoneyMatch = {
      "purchaseStatus.status": "RECEIVED",
    };

    let returnCostMatch = {
      "orderStatus.status": "RETURNED",
    };

    // if (startTime && endTime) {
    //   matchCondition = {
    //     currentStatusTime: { $gte: startTime, $lte: endTime },
    //   };

    //   createOrderCondition = {
    //     createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
    //   };
    // }

    let totalCustomersMatch = {
      resellerId: null,
    };
    let totalProductsMatch = { isDeleted: false };
    let totalRevenueMatch = {
      "orderStatus.status": "DELIVERED",
    };
    let totalRefundMatch = {
      isRefund: true,
    };
    let totalExpenseMatch = {};
    if (startTime && endTime) {
      matchCondition = {
        currentStatusTime: { $gte: startTime, $lte: endTime },
      };

      createOrderCondition = {
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };

      totalCustomersMatch = {
        ...totalCustomersMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      totalProductsMatch = {
        ...totalProductsMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      totalRevenueMatch = {
        ...totalRevenueMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      totalRefundMatch = {
        ...totalRefundMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      totalExpenseMatch = {
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      purchaseMoneyMatch = {
        ...purchaseMoneyMatch,
        "purchaseStatus.time": { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      returnCostMatch = {
        ...returnCostMatch,
        "orderStatus.time": { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
    }

    const [
      totalCustomers,
      totalProducts,
      totalRevenue,
      totalRefund,
      totalExpense,
      [createdOrder],
      orderData,
      [{ tPurchaseMoney } = {}],
      [{ tReturnCost } = {}],
    ] = await Promise.all([
      CustomerModel.countDocuments(totalCustomersMatch),
      ProductModel.countDocuments(totalProductsMatch),
      AdminOrderModel.aggregate([
        {
          $match: totalRevenueMatch,
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
          },
        },
      ]),
      AdminOrderModel.aggregate([
        {
          $match: totalRefundMatch,
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$refundMoney" },
          },
        },
      ]),
      ExpenseModel.aggregate([
        {
          $match: totalExpenseMatch,
        },
        {
          $project: {
            amount: 1,
          },
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$amount" },
          },
        },
      ]),
      AdminOrderModel.aggregate([
        {
          $match: createOrderCondition,
        },
        {
          $project: {
            _id: 1,
            customerCharge: 1,
            createdAt: 1,
          },
        },
        {
          $group: {
            _id: null,
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
          },
        },
        {
          $project: {
            status: "ALL",
            order: 1,
            price: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
      AdminOrderModel.aggregate([
        {
          $project: {
            products: 1,
            customerCharge: 1,
            currentStatus: { $arrayElemAt: ["$orderStatus.status", -1] },
            currentStatusTime: { $arrayElemAt: ["$orderStatus.time", -1] },
          },
        },
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: "$currentStatus",
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
          },
        },
        {
          $project: {
            status: "$_id",
            order: 1,
            price: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
      PurchaseModel.aggregate([
        {
          $match: purchaseMoneyMatch,
        },
        {
          $group: {
            _id: null,
            tPurchaseMoney: { $sum: "$totalBill" },
          },
        },
      ]),
      AdminOrderModel.aggregate([
        {
          $match: returnCostMatch,
        },
        {
          $group: {
            _id: null,
            tReturnCost: { $sum: "$returnMoney" },
          },
        },
      ]),
    ]);

    const updateOrderData = [];
    [
      "ALL",
      "PENDING",
      "HOLD",
      "INVOICED",
      "CONFIRM",
      // "PROCESSING",
      // "PICKED",
      "SHIPPED",
      "DELIVERED",
      "RETURNED",
      // "REFUND",
      "CANCELED",
    ].forEach((s) => {
      const existData = [createdOrder, ...orderData].find((d) => d?.status === s);
      if (existData) {
        updateOrderData.push(existData);
      } else {
        updateOrderData.push({
          status: s,
          order: 0,
          price: 0,
        });
      }
    });

    return res.status(200).json({
      data: {
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        totalRevenue: totalRevenue[0]?.price || 0,
        totalRefund: totalRefund[0]?.price || 0,
        totalExpense: totalExpense[0]?.price || 0,
        tPurchaseMoney: tPurchaseMoney || 0,
        tReturnCost: tReturnCost || 0,
        orderData: updateOrderData,
      },
      success: true,
      message: "fetch all order data",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const resellerOrderHistoryByAdmin = async (req, res) => {
  try {
    const { startTime, endTime, value } = req.body;

    let totalCustomersMatch = {
      resellerId: { $ne: null },
    };
    let totalResellerMatch = {};
    const prematurePayMatch = [
      {
        $eq: ["$resellerStatus", "confirm"],
      },
      {
        $not: {
          $in: [
            { $arrayElemAt: ["$orderStatus.status", -1] },
            ["CANCELED", "DELIVERED", "RETURNED"],
          ],
        },
      },
    ];
    const pendingPayMatch = [
      {
        $in: [{ $arrayElemAt: ["$orderStatus.status", -1] }, ["DELIVERED", "RETURNED"]],
      },
      {
        $in: ["$resellerPayStatus", ["", "cancel"]],
      },
      // {
      //   $eq: ["$orderPayStatus", "unpaid"],
      // },
    ];
    let processPayMatch = {
      "orderStatus.status": { $in: ["DELIVERED", "RETURNED"] },
      resellerStatus: "confirm",
      // orderPayStatus: "paid",
      resellerPayStatus: "pending",
    };
    let paidPayMatch = {
      "orderStatus.status": { $in: ["DELIVERED", "RETURNED"] },
      resellerStatus: "confirm",
      resellerPayStatus: "confirm",
    };
    let createOrderCondition = {};
    let matchCondition = {};

    if (req.body.value !== "") {
      const resellerData = await ResellerModel.findOne(
        {
          $or: [
            {
              phone: value,
            },
            {
              serialId: value,
            },
            {
              email: value,
            },
          ],
        },
        {
          _id: 1,
        }
      );

      if (resellerData) {
        totalCustomersMatch = {
          resellerId: ObjectId(resellerData?._id),
        };
        totalResellerMatch = {
          _id: ObjectId(resellerData?._id),
        };
        prematurePayMatch.push({
          $eq: ["$resellerInfo.resellerId", ObjectId(resellerData?._id)],
        });
        pendingPayMatch.push({
          $eq: ["$resellerInfo.resellerId", ObjectId(resellerData?._id)],
        });
        processPayMatch = {
          ...processPayMatch,
          "resellerInfo.resellerId": ObjectId(resellerData?._id),
        };
        paidPayMatch = {
          ...paidPayMatch,
          "resellerInfo.resellerId": ObjectId(resellerData?._id),
        };
        createOrderCondition = {
          "resellerInfo.resellerId": ObjectId(resellerData?._id),
        };
        matchCondition = {
          "resellerInfo.resellerId": ObjectId(resellerData?._id),
        };
      }
    }

    if (startTime && endTime) {
      matchCondition = {
        ...matchCondition,
        currentStatusTime: { $gte: startTime, $lte: endTime },
      };

      createOrderCondition = {
        ...createOrderCondition,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };

      //----------------------------------------
      totalCustomersMatch = {
        ...totalCustomersMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      totalResellerMatch = {
        ...totalResellerMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      prematurePayMatch.push(
        {
          $gte: ["$createdAt", req.body.startTime],
        },
        {
          $lte: ["$createdAt", req.body.endTime],
        }
      );
      pendingPayMatch.push(
        {
          $gte: ["$createdAt", req.body.startTime],
        },
        {
          $lte: ["$createdAt", req.body.endTime],
        }
      );
      processPayMatch = {
        ...processPayMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      paidPayMatch = {
        ...paidPayMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
    }

    const [
      totalCustomers,
      totalReseller,
      totalPrematurePay,
      totalPendingPay,
      totalProcessingPay,
      totalPaidPay,
      [createdOrder],
      orderData,
      resellerOrder,
    ] = await Promise.all([
      CustomerModel.countDocuments(totalCustomersMatch),
      ResellerModel.countDocuments(totalResellerMatch),
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: prematurePayMatch,
            },
          },
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: pendingPayMatch,
            },
          },
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: processPayMatch,
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: paidPayMatch,
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: createOrderCondition,
        },
        {
          $project: {
            _id: 1,
            customerCharge: 1,
            createdAt: 1,
            resellerInfo: 1,
          },
        },
        {
          $group: {
            _id: null,
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
            profitPrice: { $sum: "$resellerInfo.grandProfit" },
          },
        },
        {
          $project: {
            status: "ALL",
            order: 1,
            price: 1,
            profitPrice: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $project: {
            resellerInfo: 1,
            products: 1,
            customerCharge: 1,
            currentStatus: { $arrayElemAt: ["$orderStatus.status", -1] },
            currentStatusTime: { $arrayElemAt: ["$orderStatus.time", -1] },
          },
        },
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: "$currentStatus",
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
            profitPrice: { $sum: "$resellerInfo.grandProfit" },
          },
        },
        {
          $project: {
            status: "$_id",
            order: 1,
            price: 1,
            profitPrice: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $project: {
            resellerInfo: 1,
            products: 1,
            customerCharge: 1,
            currentStatus: { $arrayElemAt: ["$resellerStatusHistory.status", -1] },
            currentStatusTime: { $arrayElemAt: ["$resellerStatusHistory.time", -1] },
          },
        },
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: "$currentStatus",
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
            profitPrice: { $sum: "$resellerInfo.grandProfit" },
          },
        },
        {
          $project: {
            status: "$_id",
            order: 1,
            price: 1,
            profitPrice: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
    ]);

    const updateOrderData = [];

    [
      "ALL",
      "PENDING",
      // "HOLD",
      "INVOICED",
      "CONFIRM",
      // "PROCESSING",
      // "PICKED",
      "SHIPPED",
      "DELIVERED",
      "RETURNED",
      // "REFUND",
      "CANCELED",
    ].forEach((s) => {
      const existData = [createdOrder, ...orderData].find((d) => d?.status === s);
      if (existData) {
        updateOrderData.push(existData);
      } else {
        updateOrderData.push({
          status: s,
          order: 0,
          price: 0,
          profitPrice: 0,
        });
      }
    });

    const updateResellerOrderData = [];
    ["ALL", "pending", "hold", "confirm", "cancel"].forEach((s) => {
      const existData = [createdOrder, ...resellerOrder].find((d) => d?.status === s);
      if (existData) {
        updateResellerOrderData.push(existData);
      } else {
        updateResellerOrderData.push({
          status: s,
          order: 0,
          price: 0,
          profitPrice: 0,
        });
      }
    });

    return res.status(200).json({
      data: {
        totalCustomers: totalCustomers || 0,
        totalReseller: totalReseller || 0,
        totalPrematurePay: totalPrematurePay[0]?.price || 0,
        totalPendingPay: totalPendingPay[0]?.price || 0,
        totalProcessingPay: totalProcessingPay[0]?.price || 0,
        totalPaidPay: totalPaidPay[0]?.price || 0,
        orderData: updateOrderData,
        resellerOrderData: updateResellerOrderData,
      },
      success: true,
      message: "fetch all order data",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const singleResellerOrderHistoryByAdmin = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    let createOrderCondition = {
      "resellerInfo.resellerId": ObjectId(req.params.resellerId),
    };
    let matchCondition = {
      "resellerInfo.resellerId": ObjectId(req.params.resellerId),
    };
    let totalCustomersMatch = {
      resellerId: ObjectId(req.params.resellerId),
    };
    const prematurePayMatch = [
      {
        $eq: ["$resellerStatus", "confirm"],
      },
      {
        $eq: ["$resellerInfo.resellerId", ObjectId(req.params.resellerId)],
      },
      {
        // $in: [{ $arrayElemAt: ["$orderStatus.status", -1] }, ["PENDING", "CONFIRM", "SHIPPED"]],
        $not: {
          $in: [
            { $arrayElemAt: ["$orderStatus.status", -1] },
            ["CANCELED", "DELIVERED", "RETURNED"],
          ],
        },
      },
    ];

    const pendingPayMatch = [
      {
        $in: [{ $arrayElemAt: ["$orderStatus.status", -1] }, ["DELIVERED", "RETURNED"]],
      },
      {
        $in: ["$resellerPayStatus", ["", "cancel"]],
      },
      // {
      //   $eq: ["$orderPayStatus", "unpaid"],
      // },
      {
        $eq: ["$resellerInfo.resellerId", ObjectId(req.params.resellerId)],
      },
    ];

    let processPayMatch = {
      "orderStatus.status": { $in: ["DELIVERED", "RETURNED"] },
      resellerStatus: "confirm",
      // orderPayStatus: "paid",
      resellerPayStatus: "pending",
      "resellerInfo.resellerId": ObjectId(req.params.resellerId),
    };
    let paidPayMatch = {
      "orderStatus.status": { $in: ["DELIVERED", "RETURNED"] },
      resellerStatus: "confirm",
      resellerPayStatus: "confirm",
      "resellerInfo.resellerId": ObjectId(req.params.resellerId),
    };

    if (startTime && endTime) {
      matchCondition = {
        ...matchCondition,
        currentStatusTime: { $gte: startTime, $lte: endTime },
      };

      createOrderCondition = {
        ...createOrderCondition,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };

      //----------------------------------------
      totalCustomersMatch = {
        ...totalCustomersMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      prematurePayMatch.push(
        {
          $gte: ["$createdAt", req.body.startTime],
        },
        {
          $lte: ["$createdAt", req.body.endTime],
        }
      );
      pendingPayMatch.push(
        {
          $gte: ["$createdAt", req.body.startTime],
        },
        {
          $lte: ["$createdAt", req.body.endTime],
        }
      );
      processPayMatch = {
        ...processPayMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      paidPayMatch = {
        ...paidPayMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
    }

    const [
      totalCustomers,
      totalPrematurePay,
      totalPendingPay,
      totalProcessingPay,
      totalPaidPay,
      [createdOrder],
      orderData,
      resellerOrder,
    ] = await Promise.all([
      CustomerModel.countDocuments(totalCustomersMatch),
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: prematurePayMatch,
            },
          },
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: pendingPayMatch,
            },
          },
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: processPayMatch,
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: paidPayMatch,
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: createOrderCondition,
        },
        {
          $project: {
            _id: 1,
            customerCharge: 1,
            createdAt: 1,
            resellerInfo: 1,
          },
        },
        {
          $group: {
            _id: null,
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
            profitPrice: { $sum: "$resellerInfo.grandProfit" },
          },
        },
        {
          $project: {
            status: "ALL",
            order: 1,
            price: 1,
            profitPrice: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $project: {
            products: 1,
            customerCharge: 1,
            currentStatus: { $arrayElemAt: ["$orderStatus.status", -1] },
            currentStatusTime: { $arrayElemAt: ["$orderStatus.time", -1] },
            resellerInfo: 1,
          },
        },
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: "$currentStatus",
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
            profitPrice: { $sum: "$resellerInfo.grandProfit" },
          },
        },
        {
          $project: {
            status: "$_id",
            order: 1,
            price: 1,
            profitPrice: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $project: {
            resellerInfo: 1,
            products: 1,
            customerCharge: 1,
            currentStatus: { $arrayElemAt: ["$resellerStatusHistory.status", -1] },
            currentStatusTime: { $arrayElemAt: ["$resellerStatusHistory.time", -1] },
          },
        },
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: "$currentStatus",
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
            profitPrice: { $sum: "$resellerInfo.grandProfit" },
          },
        },
        {
          $project: {
            status: "$_id",
            order: 1,
            price: 1,
            profitPrice: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
    ]);

    const updateOrderData = [];
    [
      "ALL",
      "PENDING",
      // "HOLD",
      "INVOICED",
      "CONFIRM",
      // "PROCESSING",
      // "PICKED",
      "SHIPPED",
      "DELIVERED",
      "RETURNED",
      // "REFUND",
      "CANCELED",
    ].forEach((s) => {
      const existData = [createdOrder, ...orderData].find((d) => d?.status === s);
      if (existData) {
        updateOrderData.push(existData);
      } else {
        updateOrderData.push({
          status: s,
          order: 0,
          price: 0,
          profitPrice: 0,
        });
      }
    });

    const updateResellerOrderData = [];
    ["ALL", "pending", "hold", "confirm", "cancel"].forEach((s) => {
      const existData = [createdOrder, ...resellerOrder].find((d) => d?.status === s);
      if (existData) {
        updateResellerOrderData.push(existData);
      } else {
        updateResellerOrderData.push({
          status: s,
          order: 0,
          price: 0,
          profitPrice: 0,
        });
      }
    });

    return res.status(200).json({
      data: {
        totalCustomers: totalCustomers || 0,
        totalPrematurePay: totalPrematurePay[0]?.price || 0,
        totalPendingPay: totalPendingPay[0]?.price || 0,
        totalProcessingPay: totalProcessingPay[0]?.price || 0,
        totalPaidPay: totalPaidPay[0]?.price || 0,
        orderData: updateOrderData,
        resellerOrderData: updateResellerOrderData,
      },
      success: true,
      message: "fetch all order data",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const resellerOrderHistoryByReseller = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    let createOrderCondition = {
      "resellerInfo.resellerId": ObjectId(req.user._id),
    };
    let matchCondition = {
      "resellerInfo.resellerId": ObjectId(req.user._id),
    };
    let totalCustomersMatch = {
      resellerId: ObjectId(req.user._id),
    };
    const prematurePayMatch = [
      {
        $eq: ["$resellerStatus", "confirm"],
      },
      {
        $eq: ["$resellerInfo.resellerId", ObjectId(req.user._id)],
      },
      {
        // $in: [{ $arrayElemAt: ["$orderStatus.status", -1] }, ["PENDING", "CONFIRM", "SHIPPED"]],
        $not: {
          $in: [
            { $arrayElemAt: ["$orderStatus.status", -1] },
            ["CANCELED", "DELIVERED", "RETURNED"],
          ],
        },
      },
    ];

    const pendingPayMatch = [
      {
        $in: [{ $arrayElemAt: ["$orderStatus.status", -1] }, ["DELIVERED", "RETURNED"]],
      },
      {
        $in: ["$resellerPayStatus", ["", "cancel"]],
      },
      // {
      //   $eq: ["$orderPayStatus", "unpaid"],
      // },
      {
        $eq: ["$resellerInfo.resellerId", ObjectId(req.user._id)],
      },
    ];

    let processPayMatch = {
      "orderStatus.status": { $in: ["DELIVERED", "RETURNED"] },
      resellerStatus: "confirm",
      // orderPayStatus: "paid",
      resellerPayStatus: "pending",
      "resellerInfo.resellerId": ObjectId(req.user._id),
    };
    let paidPayMatch = {
      "orderStatus.status": { $in: ["DELIVERED", "RETURNED"] },
      resellerStatus: "confirm",
      resellerPayStatus: "confirm",
      "resellerInfo.resellerId": ObjectId(req.user._id),
    };

    if (startTime && endTime) {
      matchCondition = {
        ...matchCondition,
        currentStatusTime: { $gte: startTime, $lte: endTime },
      };

      createOrderCondition = {
        ...createOrderCondition,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };

      //----------------------------------------
      totalCustomersMatch = {
        ...totalCustomersMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      prematurePayMatch.push(
        {
          $gte: ["$createdAt", req.body.startTime],
        },
        {
          $lte: ["$createdAt", req.body.endTime],
        }
      );
      pendingPayMatch.push(
        {
          $gte: ["$createdAt", req.body.startTime],
        },
        {
          $lte: ["$createdAt", req.body.endTime],
        }
      );
      processPayMatch = {
        ...processPayMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      paidPayMatch = {
        ...paidPayMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
    }

    const [
      totalCustomers,
      totalPrematurePay,
      totalPendingPay,
      totalProcessingPay,
      totalPaidPay,
      [createdOrder],
      orderData,
      resellerOrder,
    ] = await Promise.all([
      CustomerModel.countDocuments(totalCustomersMatch),
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: prematurePayMatch,
            },
          },
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: pendingPayMatch,
            },
          },
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: processPayMatch,
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: paidPayMatch,
        },
        {
          $group: {
            _id: null,
            price: { $sum: "$resellerInfo.grandProfit" },
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $match: createOrderCondition,
        },
        {
          $project: {
            _id: 1,
            customerCharge: 1,
            createdAt: 1,
            resellerInfo: 1,
          },
        },
        {
          $group: {
            _id: null,
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
            profitPrice: { $sum: "$resellerInfo.grandProfit" },
          },
        },
        {
          $project: {
            status: "ALL",
            order: 1,
            price: 1,
            profitPrice: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $project: {
            products: 1,
            customerCharge: 1,
            currentStatus: { $arrayElemAt: ["$orderStatus.status", -1] },
            currentStatusTime: { $arrayElemAt: ["$orderStatus.time", -1] },
            resellerInfo: 1,
          },
        },
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: "$currentStatus",
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
            profitPrice: { $sum: "$resellerInfo.grandProfit" },
          },
        },
        {
          $project: {
            status: "$_id",
            order: 1,
            price: 1,
            profitPrice: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
      ResellerOrderModel.aggregate([
        {
          $project: {
            resellerInfo: 1,
            products: 1,
            customerCharge: 1,
            currentStatus: { $arrayElemAt: ["$resellerStatusHistory.status", -1] },
            currentStatusTime: { $arrayElemAt: ["$resellerStatusHistory.time", -1] },
          },
        },
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: "$currentStatus",
            order: { $sum: 1 },
            price: { $sum: "$customerCharge.afterDiscountTotalPrice" },
            profitPrice: { $sum: "$resellerInfo.grandProfit" },
          },
        },
        {
          $project: {
            status: "$_id",
            order: 1,
            price: 1,
            profitPrice: 1,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]),
    ]);

    const updateOrderData = [];
    [
      "ALL",
      "PENDING",
      "HOLD",
      "INVOICED",
      "CONFIRM",
      // "PROCESSING",
      // "PICKED",
      "SHIPPED",
      "DELIVERED",
      "RETURNED",
      // "REFUND",
      "CANCELED",
    ].forEach((s) => {
      const existData = [createdOrder, ...orderData].find((d) => d?.status === s);
      if (existData) {
        updateOrderData.push(existData);
      } else {
        updateOrderData.push({
          status: s,
          order: 0,
          price: 0,
          profitPrice: 0,
        });
      }
    });

    const updateResellerOrderData = [];
    ["ALL", "pending", "hold", "confirm", "cancel"].forEach((s) => {
      const existData = [createdOrder, ...resellerOrder].find((d) => d?.status === s);
      if (existData) {
        updateResellerOrderData.push(existData);
      } else {
        updateResellerOrderData.push({
          status: s,
          order: 0,
          price: 0,
          profitPrice: 0,
        });
      }
    });

    return res.status(200).json({
      data: {
        totalCustomers: totalCustomers || 0,
        totalPrematurePay: totalPrematurePay[0]?.price || 0,
        totalPendingPay: totalPendingPay[0]?.price || 0,
        totalProcessingPay: totalProcessingPay[0]?.price || 0,
        totalPaidPay: totalPaidPay[0]?.price || 0,
        orderData: updateOrderData,
        resellerOrderData: updateResellerOrderData,
      },
      success: true,
      message: "fetch all order data",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const topResellersByAdmin = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    // confirm - "PENDING", "CONFIRM","SHIPPED", "DELIVERED","RETURNED"
    // by order num
    // by order amount (commission)

    const matchCondition = [
      {
        $eq: ["$resellerStatus", "confirm"],
      },
      {
        // $in: [
        //   { $arrayElemAt: ["$orderStatus.status", -1] },
        //   ["PENDING", "CONFIRM", "SHIPPED", "DELIVERED", "RETURNED"],
        // ],
        //  { orderStatus: { $ne: [] } }
        $ne: ["$orderStatus", []],
      },
    ];

    if (req.body.startTime && req.body.endTime) {
      matchCondition.push({
        $gte: ["$createdAt", req.body.startTime],
      });
      matchCondition.push({
        $lte: ["$createdAt", req.body.endTime],
      });
    }

    let sortCondition = {
      tCommission: -1,
    };

    // sortBy = commission, orderNum, orderAmount
    if (req.body.sortBy === "orderNum") {
      sortCondition = {
        tOrder: -1,
      };
    } else if (req.body.sortBy === "orderAmount") {
      sortCondition = {
        tOrderAmount: -1,
      };
    }

    const [resellerData, [{ totalData } = {}]] = await Promise.all([
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: matchCondition,
            },
          },
        },
        {
          $project: {
            resellerInfo: 1,
            customerCharge: 1,
            totalQty: 1,
            status: { $arrayElemAt: ["$orderStatus.status", -1] },
          },
        },
        {
          $group: {
            _id: {
              resellerId: "$resellerInfo.resellerId",
              status: "$status",
            },
            tOrder: { $sum: 1 },
            tTotalQty: { $sum: "$totalQty" },
            tCommission: { $sum: "$resellerInfo.profitMoney" },
            tOrderAmount: { $sum: "$customerCharge.totalBill" },
          },
        },
        {
          $group: {
            _id: "$_id.resellerId",
            tOrder: { $sum: "$tOrder" },
            tTotalQty: { $sum: "$tTotalQty" },
            tCommission: { $sum: "$tCommission" },
            tOrderAmount: { $sum: "$tOrderAmount" },
            orderCountByStatus: {
              $push: {
                status: "$_id.status",
                tOrder: { $sum: "$tOrder" },
                tTotalQty: { $sum: "$tTotalQty" },
                tCommission: { $sum: "$tCommission" },
                tOrderAmount: { $sum: "$tOrderAmount" },
              },
            },
          },
        },
        {
          $sort: sortCondition,
        },
        {
          $lookup: {
            from: "resellers",
            localField: "_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  serialId: 1,
                  commission: 1,
                  name: 1,
                  phone: 1,
                  email: 1,
                  image: 1,
                  address: 1,
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
      ResellerOrderModel.aggregate([
        {
          $match: {
            $expr: {
              $and: matchCondition,
            },
          },
        },
        {
          $project: {
            resellerInfo: 1,
            status: { $arrayElemAt: ["$orderStatus.status", -1] },
          },
        },
        {
          $group: {
            _id: {
              resellerId: "$resellerInfo.resellerId",
              status: "$status",
            },
          },
        },
        {
          $group: {
            _id: "$_id.resellerId",
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

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: resellerData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const topProductsByAdmin = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [];

    if (req.body.startTime && req.body.endTime) {
      matchCondition.push({
        $gte: ["$orderData.createdAt", req.body.startTime],
      });
      matchCondition.push({
        $lte: ["$orderData.createdAt", req.body.endTime],
      });
    }

    let sortCondition = {
      tQuantity: -1,
    };

    // sortBy = commission, quantity, price
    if (req.body.sortBy === "commission") {
      sortCondition = {
        tCommission: -1,
      };
    } else if (req.body.sortBy === "price") {
      sortCondition = {
        tPrice: -1,
      };
    }

    const [resellerData, totalData] = await Promise.all([
      ResellerOrderProductsModel.aggregate([
        {
          $match:
            matchCondition.length > 0
              ? {
                  $expr: {
                    $and: matchCondition,
                  },
                }
              : {},
        },
        {
          $group: {
            _id: "$productId",
            tPrice: { $sum: "$price" },
            tQuantity: { $sum: "$quantity" },
            tCommission: { $sum: "$resellerInfo.profitMoney" },
          },
        },
        {
          $sort: sortCondition,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  slug: 1,
                  sku: 1,
                  galleryImage: 1,
                  totalSell: 1,
                },
              },
            ],
            as: "product",
          },
        },
        {
          $unwind: {
            path: "$product",
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
      ResellerOrderProductsModel.countDocuments(
        matchCondition.length > 0
          ? {
              $expr: {
                $and: matchCondition,
              },
            }
          : {}
      ),
    ]);

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: resellerData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const topProductsByReseller = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const resellerOrderIdData = await ResellerOrderModel.find(
      {
        "resellerInfo.resellerId": ObjectId(req.user._id),
      },
      { _id: 1 }
    );

    // return res.json({ resellerOrderIds });

    if (resellerOrderIdData.length < 0) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "No product found!",
      });
    }

    const matchCondition = [
      {
        $in: ["$orderId", resellerOrderIdData.map((i) => ObjectId(i?._id))],
      },
    ];

    if (req.body.startTime && req.body.endTime) {
      matchCondition.push({
        $gte: ["$orderData.createdAt", req.body.startTime],
      });
      matchCondition.push({
        $lte: ["$orderData.createdAt", req.body.endTime],
      });
    }

    let sortCondition = {
      tQuantity: -1,
    };

    // sortBy = commission, quantity, price
    if (req.body.sortBy === "commission") {
      sortCondition = {
        tCommission: -1,
      };
    } else if (req.body.sortBy === "price") {
      sortCondition = {
        tPrice: -1,
      };
    }

    const [resellerData, totalData] = await Promise.all([
      ResellerOrderProductsModel.aggregate([
        {
          $match:
            matchCondition.length > 0
              ? {
                  $expr: {
                    $and: matchCondition,
                  },
                }
              : {},
        },
        {
          $group: {
            _id: "$productId",
            tPrice: { $sum: "$price" },
            tQuantity: { $sum: "$quantity" },
            tCommission: { $sum: "$resellerInfo.profitMoney" },
          },
        },
        {
          $sort: sortCondition,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  slug: 1,
                  sku: 1,
                  galleryImage: 1,
                  totalSell: 1,
                },
              },
            ],
            as: "product",
          },
        },
        {
          $unwind: {
            path: "$product",
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
      ResellerOrderProductsModel.countDocuments(
        matchCondition.length > 0
          ? {
              $expr: {
                $and: matchCondition,
              },
            }
          : {}
      ),
    ]);

    if (!resellerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: resellerData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const topProductsFromAllOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {};
    const orderMatchCondition = [];

    if (req.body.startTime && req.body.endTime) {
      matchCondition = {
        createdAt: {
          $gte: req.body.startTime,
          $lte: req.body.endTime,
        },
      };
      orderMatchCondition.push({ $gte: ["$createdAt", req.body.startTime] });
      orderMatchCondition.push({ $lte: ["$createdAt", req.body.endTime] });
    }

    let sortCondition = {
      tQuantity: -1,
    };

    // sortBy =  quantity, price
    if (req.body.sortBy === "commission") {
      sortCondition = {
        tCommission: -1,
      };
    } else if (req.body.sortBy === "price") {
      sortCondition = {
        tPrice: -1,
      };
    }

    const [resellerTopProductData, [{ totalData } = {}]] = await Promise.all([
      AdminOrderProductsModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $project: {
            orderId: 1,
            productId: 1,
            quantity: 1,
            price: 1,
            resellerInfo: 1,
          },
        },
        {
          $unionWith: {
            coll: "admin_order_combo_products",
            pipeline: [
              {
                $match: matchCondition,
              },
              {
                $project: {
                  orderId: 1,
                  productId: 1,
                  quantity: 1,
                  price: 1,
                },
              },
            ],
          },
        },
        {
          $unionWith: {
            coll: "admin_orders",
            pipeline: [
              {
                $match:
                  orderMatchCondition.length > 0
                    ? {
                        $expr: {
                          $and: orderMatchCondition,
                        },
                      }
                    : {},
              },
              {
                $project: {
                  orderId: "$_id",
                  status: { $arrayElemAt: ["$orderStatus.status", -1] },
                  createdAt: 1,
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: "$orderId",
            createdAt: { $first: "$createdAt" },
            status: { $max: "$status" },
            productData: {
              $push: {
                orderId: "$orderId",
                productId: "$productId",
                quantity: "$quantity",
                price: "$price",
              },
            },
          },
        },
        {
          $unwind: { path: "$productData", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            status: { $ne: null },
          },
        },
        {
          $match: {
            "productData.productId": { $exists: true },
          },
        },
        {
          $set: {
            productData: "$productData",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$$ROOT", "$productData"],
            },
          },
        },
        {
          $group: {
            _id: {
              productId: "$productId",
              status: "$status",
            },
            count: { $sum: 1 },
            tPrice: { $sum: { $multiply: ["$price", "$quantity"] } },
            tQuantity: { $sum: "$quantity" },
          },
        },
        {
          $group: {
            _id: "$_id.productId",
            count: { $sum: "$count" },
            tPrice: { $sum: "$tPrice" },
            tQuantity: { $sum: "$tQuantity" },
            orderData: {
              $push: {
                status: "$_id.status",
                count: { $sum: "$count" },
                tPrice: { $sum: "$tPrice" },
                tQuantity: { $sum: "$tQuantity" },
                // orderProductData: {
                //   tPrice: { $sum: "$tPrice" },
                //   tQuantity: { $sum: "$tQuantity" },
                // },
              },
            },
          },
        },
        {
          $sort: sortCondition,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  slug: 1,
                  sku: 1,
                  galleryImage: 1,
                  totalSell: 1,
                },
              },
            ],
            as: "product",
          },
        },
        {
          $unwind: { path: "$product", preserveNullAndEmptyArrays: true },
        },
      ]),
      AdminOrderProductsModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $project: {
            orderId: 1,
            productId: 1,
            quantity: 1,
            price: 1,
            resellerInfo: 1,
          },
        },
        {
          $unionWith: {
            coll: "admin_order_combo_products",
            pipeline: [
              {
                $match: matchCondition,
              },
              {
                $project: {
                  orderId: 1,
                  productId: 1,
                  quantity: 1,
                  price: 1,
                },
              },
            ],
          },
        },
        {
          $unionWith: {
            coll: "admin_orders",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: orderMatchCondition,
                  },
                },
              },
              {
                $project: {
                  orderId: "$_id",
                  status: { $arrayElemAt: ["$orderStatus.status", -1] },
                  createdAt: 1,
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: "$orderId",
            createdAt: { $first: "$createdAt" },
            status: { $max: "$status" },
            productData: {
              $push: {
                orderId: "$orderId",
                productId: "$productId",
                quantity: "$quantity",
                price: "$price",
              },
            },
          },
        },
        {
          $unwind: { path: "$productData", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            status: { $ne: null },
          },
        },
        {
          $match: {
            "productData.productId": { $exists: true },
          },
        },
        {
          $set: {
            productData: "$productData",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$$ROOT", "$productData"],
            },
          },
        },
        {
          $group: {
            _id: {
              productId: "$productId",
            },
          },
        },
        {
          $group: {
            _id: "$_id.productId",
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

    if (!resellerTopProductData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: resellerTopProductData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const topProductsFromResellerOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {};
    const orderMatchCondition = [
      // {
      //   $in: ["$_id", "$$orderIds"],
      // },
      {
        $eq: ["$resellerStatus", "confirm"],
      },
      {
        $ne: ["$orderStatus", []],
      },
    ];

    if (req.body.startTime && req.body.endTime) {
      matchCondition = {
        createdAt: {
          $gte: req.body.startTime,
          $lte: req.body.endTime,
        },
      };
      orderMatchCondition.push({ $gte: ["$createdAt", req.body.startTime] });
      orderMatchCondition.push({ $lte: ["$createdAt", req.body.endTime] });
    }

    let sortCondition = {
      tQuantity: -1,
    };

    // sortBy =  quantity, price
    if (req.body.sortBy === "commission") {
      sortCondition = {
        tCommission: -1,
      };
    } else if (req.body.sortBy === "price") {
      sortCondition = {
        tPrice: -1,
      };
    }

    const [resellerTopProductData, [{ totalData } = {}]] = await Promise.all([
      ResellerOrderProductsModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $project: {
            orderId: 1,
            productId: 1,
            quantity: 1,
            price: 1,
            resellerInfo: 1,
          },
        },
        {
          $unionWith: {
            coll: "reseller_order_combo_products",
            pipeline: [
              {
                $match: matchCondition,
              },
              {
                $project: {
                  orderId: 1,
                  productId: 1,
                  quantity: 1,
                  price: 1,
                  resellerInfo: 1,
                },
              },
            ],
          },
        },
        {
          $unionWith: {
            coll: "reseller_orders",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: orderMatchCondition,
                  },
                },
              },
              {
                $project: {
                  orderId: "$_id",
                  status: { $arrayElemAt: ["$orderStatus.status", -1] },
                  createdAt: 1,
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: "$orderId",
            createdAt: { $first: "$createdAt" },
            status: { $max: "$status" },
            productData: {
              $push: {
                orderId: "$orderId",
                productId: "$productId",
                quantity: "$quantity",
                price: "$price",
                resellerInfo: "$resellerInfo",
              },
            },
          },
        },
        {
          $unwind: { path: "$productData", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            status: { $ne: null },
          },
        },
        {
          $match: {
            "productData.productId": { $exists: true },
          },
        },
        {
          $set: {
            productData: "$productData",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$$ROOT", "$productData"],
            },
          },
        },
        {
          $group: {
            _id: {
              productId: "$productId",
              status: "$status",
            },
            count: { $sum: 1 },
            tPrice: { $sum: { $multiply: ["$price", "$quantity"] } },
            tQuantity: { $sum: "$quantity" },
            tCommission: { $sum: "$resellerInfo.profitMoney" },
          },
        },
        {
          $group: {
            _id: "$_id.productId",
            count: { $sum: "$count" },
            tPrice: { $sum: "$tPrice" },
            tQuantity: { $sum: "$tQuantity" },
            tCommission: { $sum: "$tCommission" },
            orderData: {
              $push: {
                status: "$_id.status",
                count: { $sum: "$count" },
                tPrice: { $sum: "$tPrice" },
                tQuantity: { $sum: "$tQuantity" },
                tCommission: { $sum: "$tCommission" },
                // orderProductData: {
                //   tPrice: { $sum: "$tPrice" },
                //   tQuantity: { $sum: "$tQuantity" },
                //   tCommission: { $sum: "$tCommission" },
                // },
              },
            },
          },
        },
        {
          $sort: sortCondition,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  slug: 1,
                  sku: 1,
                  galleryImage: 1,
                  totalSell: 1,
                },
              },
            ],
            as: "product",
          },
        },
        {
          $unwind: { path: "$product", preserveNullAndEmptyArrays: true },
        },
      ]),
      ResellerOrderProductsModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $project: {
            orderId: 1,
            productId: 1,
            quantity: 1,
            price: 1,
            resellerInfo: 1,
          },
        },
        {
          $unionWith: {
            coll: "reseller_order_combo_products",
            pipeline: [
              {
                $match: matchCondition,
              },
              {
                $project: {
                  orderId: 1,
                  productId: 1,
                  quantity: 1,
                  price: 1,
                  resellerInfo: 1,
                },
              },
            ],
          },
        },
        {
          $unionWith: {
            coll: "reseller_orders",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: orderMatchCondition,
                  },
                },
              },
              {
                $project: {
                  orderId: "$_id",
                  status: { $arrayElemAt: ["$orderStatus.status", -1] },
                  createdAt: 1,
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: "$orderId",
            createdAt: { $first: "$createdAt" },
            status: { $max: "$status" },
            productData: {
              $push: {
                orderId: "$orderId",
                productId: "$productId",
                quantity: "$quantity",
                price: "$price",
                resellerInfo: "$resellerInfo",
              },
            },
          },
        },
        {
          $unwind: { path: "$productData", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            status: { $ne: null },
          },
        },
        {
          $match: {
            "productData.productId": { $exists: true },
          },
        },
        {
          $set: {
            productData: "$productData",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$$ROOT", "$productData"],
            },
          },
        },
        {
          $group: {
            _id: {
              productId: "$productId",
            },
          },
        },
        {
          $group: {
            _id: "$_id.productId",
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

    if (!resellerTopProductData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: resellerTopProductData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const districtBaseOrder = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        $ne: ["$orderStatus", []],
      },
    ];

    if (req.body.startTime && req.body.endTime) {
      matchCondition.push({ $gte: ["$createdAt", req.body.startTime] });
      matchCondition.push({ $lte: ["$createdAt", req.body.endTime] });
    }

    // sortBy =  orderNum, price
    let sortCondition = {
      tOrder: -1,
    };
    if (req.body.sortBy === "price") {
      sortCondition = {
        tPrice: -1,
      };
    }

    let conditionalPipeline = [
      {
        $match: {
          $expr: {
            $and: matchCondition,
          },
        },
      },
      {
        $project: {
          cityId: "$deliveryAddress.cityId",
          customerCharge: 1,
          status: { $arrayElemAt: ["$orderStatus.status", -1] },
        },
      },
      {
        $group: {
          _id: {
            cityId: "$cityId",
            status: "$status",
          },
          tOrder: { $sum: 1 },
          tPrice: { $sum: "$customerCharge.totalBill" },
        },
      },
      {
        $group: {
          _id: "$_id.cityId",
          tOrder: { $sum: "$tOrder" },
          tPrice: { $sum: "$tPrice" },
          ordersByStatus: {
            $push: {
              status: "$_id.status",
              tOrder: "$tOrder",
              tPrice: "$tPrice",
            },
          },
        },
      },
    ];
    const paginatePipeline = [
      {
        $sort: sortCondition,
      },
      {
        $lookup: {
          from: "pathao_cities",
          localField: "_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                city_name: 1,
              },
            },
          ],
          as: "cityData",
        },
      },
      {
        $unwind: {
          path: "$cityData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $skip: (page - 1) * pageLimit,
      },
      {
        $limit: pageLimit,
      },
    ];
    let promiseArr = [];

    if (req.body.orderType === "all") {
      conditionalPipeline = [
        {
          $unionWith: {
            coll: "reseller_orders",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: matchCondition,
                  },
                },
              },
            ],
          },
        },
        ...conditionalPipeline,
      ];
      promiseArr = [
        AdminOrderModel.aggregate([...conditionalPipeline, ...paginatePipeline]),
        AdminOrderModel.aggregate([
          ...conditionalPipeline,
          {
            $group: {
              _id: null,
              totalData: { $sum: 1 },
            },
          },
        ]),
      ];
    }
    if (req.body.orderType === "own") {
      promiseArr = [
        AdminOrderModel.aggregate([...conditionalPipeline, ...paginatePipeline]),
        AdminOrderModel.aggregate([
          ...conditionalPipeline,
          {
            $group: {
              _id: null,
              totalData: { $sum: 1 },
            },
          },
        ]),
      ];
    }
    if (req.body.orderType === "reseller") {
      promiseArr = [
        ResellerOrderModel.aggregate([...conditionalPipeline, ...paginatePipeline]),
        ResellerOrderModel.aggregate([
          ...conditionalPipeline,
          {
            $group: {
              _id: null,
              totalData: { $sum: 1 },
            },
          },
        ]),
      ];
    }

    const [customerData, [{ totalData } = {}]] = await Promise.all(promiseArr);

    if (!customerData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: customerData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** adminCustomer: fetchAllCustomerList ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const test = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {};
    const orderMatchCondition = [];

    if (req.body.startTime && req.body.endTime) {
      matchCondition = {
        createdAt: {
          $gte: req.body.startTime,
          $lte: req.body.endTime,
        },
      };
      orderMatchCondition.push({ $gte: ["$createdAt", req.body.startTime] });
      orderMatchCondition.push({ $lte: ["$createdAt", req.body.endTime] });
    }

    let sortCondition = {
      tQuantity: -1,
    };

    // sortBy =  quantity, price
    if (req.body.sortBy === "commission") {
      sortCondition = {
        tCommission: -1,
      };
    } else if (req.body.sortBy === "price") {
      sortCondition = {
        tPrice: -1,
      };
    }

    const [resellerTopProductData, [{ totalData } = {}]] = await Promise.all([
      AdminOrderProductsModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $project: {
            orderId: 1,
            productId: 1,
            quantity: 1,
            price: 1,
            resellerInfo: 1,
          },
        },
        {
          $unionWith: {
            coll: "admin_order_combo_products",
            pipeline: [
              {
                $match: matchCondition,
              },
              {
                $project: {
                  orderId: 1,
                  productId: 1,
                  quantity: 1,
                  price: 1,
                },
              },
            ],
          },
        },
        {
          $unionWith: {
            coll: "admin_orders",
            pipeline: [
              {
                $match:
                  orderMatchCondition.length > 0
                    ? {
                        $expr: {
                          $and: orderMatchCondition,
                        },
                      }
                    : {},
              },
              {
                $project: {
                  orderId: "$_id",
                  status: { $arrayElemAt: ["$orderStatus.status", -1] },
                  createdAt: 1,
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: "$orderId",
            createdAt: { $first: "$createdAt" },
            status: { $max: "$status" },
            productData: {
              $push: {
                orderId: "$orderId",
                productId: "$productId",
                quantity: "$quantity",
                price: "$price",
              },
            },
          },
        },
        {
          $unwind: { path: "$productData", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            status: { $ne: null },
          },
        },
        {
          $match: {
            "productData.productId": { $exists: true },
          },
        },
        {
          $set: {
            productData: "$productData",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$$ROOT", "$productData"],
            },
          },
        },
        {
          $group: {
            _id: {
              productId: "$productId",
              status: "$status",
            },
            count: { $sum: 1 },
            tPrice: { $sum: { $multiply: ["$price", "$quantity"] } },
            tQuantity: { $sum: "$quantity" },
          },
        },
        {
          $group: {
            _id: "$_id.productId",
            count: { $sum: "$count" },
            tPrice: { $sum: "$tPrice" },
            tQuantity: { $sum: "$tQuantity" },
            orderData: {
              $push: {
                status: "$_id.status",
                count: { $sum: "$count" },
                orderProductData: {
                  tPrice: { $sum: "$tPrice" },
                  tQuantity: { $sum: "$tQuantity" },
                },
              },
            },
          },
        },
        {
          $sort: sortCondition,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  slug: 1,
                  sku: 1,
                  galleryImage: 1,
                  totalSell: 1,
                },
              },
            ],
            as: "product",
          },
        },
        {
          $unwind: { path: "$product", preserveNullAndEmptyArrays: true },
        },
      ]),
      AdminOrderProductsModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $project: {
            orderId: 1,
            productId: 1,
            quantity: 1,
            price: 1,
            resellerInfo: 1,
          },
        },
        {
          $unionWith: {
            coll: "admin_order_combo_products",
            pipeline: [
              {
                $match: matchCondition,
              },
              {
                $project: {
                  orderId: 1,
                  productId: 1,
                  quantity: 1,
                  price: 1,
                },
              },
            ],
          },
        },
        {
          $unionWith: {
            coll: "admin_orders",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: orderMatchCondition,
                  },
                },
              },
              {
                $project: {
                  orderId: "$_id",
                  status: { $arrayElemAt: ["$orderStatus.status", -1] },
                  createdAt: 1,
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: "$orderId",
            createdAt: { $first: "$createdAt" },
            status: { $max: "$status" },
            productData: {
              $push: {
                orderId: "$orderId",
                productId: "$productId",
                quantity: "$quantity",
                price: "$price",
              },
            },
          },
        },
        {
          $unwind: { path: "$productData", preserveNullAndEmptyArrays: true },
        },
        {
          $match: {
            status: { $ne: null },
          },
        },
        {
          $match: {
            "productData.productId": { $exists: true },
          },
        },
        {
          $set: {
            productData: "$productData",
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$$ROOT", "$productData"],
            },
          },
        },
        {
          $group: {
            _id: {
              productId: "$productId",
            },
          },
        },
        {
          $group: {
            _id: "$_id.productId",
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

    if (!resellerTopProductData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch all orders!",
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: resellerTopProductData,
      message: "Fetch all orders successfully.",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  // admin
  adminOrderHistoryByAdmin,
  resellerOrderHistoryByAdmin,
  singleResellerOrderHistoryByAdmin,

  // reseller
  resellerOrderHistoryByReseller,

  // top reseller
  topResellersByAdmin,
  topProductsByAdmin,
  topProductsByReseller,

  // new
  topProductsFromAllOrder,
  topProductsFromResellerOrder,
  districtBaseOrder,
  test,
};
