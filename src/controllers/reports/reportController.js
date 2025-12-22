const ProductModel = require("../../models/product/product");
const OrderModel = require("../../models/order/order");
const PurchaseModel = require("../../models/purchase/purchase");
const ExpenseModel = require("../../models/expense/expense");
const CampaignCostModel = require("../../models/campaign/campaignCost");
// const uploadImage = require("../../utils/upload-img");
// const deleteFile = require("../../utils/delete-file");

const productsReport = async (req, res) => {
  try {
    const productData = await ProductModel.aggregate([
      {
        $match: { isDeleted: { $eq: false } },
      },
      {
        $lookup: {
          from: "variations",
          localField: "variations",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "attribute_opts",
                localField: "attributeOpts",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: "attributeOpts",
              },
            },
            {
              $project: {
                attributeOpts: 1,
                stock: 1,
                purchaseQty: 1,
                totalPurchasePrice: 1,
                sellQty: 1,
                totalSellPrice: 1,
              },
            },
          ],
          as: "variations",
        },
      },
      {
        $project: {
          name: 1,
          sku: 1,
          isVariant: 1,
          variations: 1,
          nonVariation: {
            stock: 1,
            purchaseQty: 1,
            totalPurchasePrice: 1,
            sellQty: 1,
            totalSellPrice: 1,
          },
        },
      },
    ]);

    return res.status(200).json({
      data: productData,
      message: "Updated successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** reportController: productsReport ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const accountReportByDateRange = async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    let deliveryChargeMatch = {
      "orderStatus.status": "DELIVERED",
    };

    let returnCostMatch = {
      "orderStatus.status": "RETURNED",
    };
    let refundCostMatch = {
      "orderStatus.status": "REFUND",
    };
    let purchaseMoneyMatch = {
      "purchaseStatus.status": "RECEIVED",
    };
    let expenseMatch = {};
    let campaignCostMatch = {};

    if (startTime && endTime) {
      deliveryChargeMatch = {
        ...deliveryChargeMatch,
        "orderStatus.time": { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      returnCostMatch = {
        ...returnCostMatch,
        "orderStatus.time": { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      refundCostMatch = {
        ...refundCostMatch,
        "orderStatus.time": { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      purchaseMoneyMatch = {
        ...purchaseMoneyMatch,
        "purchaseStatus.time": { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      expenseMatch = {
        ...expenseMatch,
        createdAt: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
      campaignCostMatch = {
        ...campaignCostMatch,
        payTime: { $gte: new Date(startTime), $lte: new Date(endTime) },
      };
    }

    const [
      [{ tDeliveryCharge } = {}],
      [{ tReturnCost } = {}],
      [{ tRefundCost } = {}],
      [{ tPurchaseMoney } = {}],
      [{ tExpense } = {}],
      [{ tCampaignCost } = {}],
    ] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: deliveryChargeMatch,
        },
        {
          $group: {
            _id: null,
            tDeliveryCharge: { $sum: "$customerCharge.afterDiscountTotalPrice" },
          },
        },
      ]),
      OrderModel.aggregate([
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
      OrderModel.aggregate([
        {
          $match: refundCostMatch,
        },
        {
          $group: {
            _id: null,
            tRefundCost: { $sum: "$refundMoney" },
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
      ExpenseModel.aggregate([
        {
          $match: expenseMatch,
        },
        {
          $group: {
            _id: null,
            tExpense: { $sum: "$amount" },
          },
        },
      ]),
      CampaignCostModel.aggregate([
        {
          $match: campaignCostMatch,
        },
        {
          $group: {
            _id: null,
            tCampaignCost: { $sum: "$bdtCost" },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      data: {
        tDeliveryCharge: tDeliveryCharge || 0,
        tReturnCost: tReturnCost || 0,
        tRefundCost: tRefundCost || 0,
        tPurchaseMoney: tPurchaseMoney || 0,
        tExpense: tExpense || 0,
        tCampaignCost: tCampaignCost || 0,
      },
      success: false,
      message: "Fetch Successfully",
    });
  } catch (err) {
    console.log("*** reportController: productsReport ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const htmlToPdfOfProductReport = async (req, res) => {
  try {
    return res.json({ msg: "hi" });
  } catch (err) {
    console.log("*** reportController: productsReport ***");
    console.log(err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  productsReport,
  accountReportByDateRange,
  htmlToPdfOfProductReport,
};
