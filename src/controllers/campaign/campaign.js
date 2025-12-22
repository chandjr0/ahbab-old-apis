const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const OrderModel = require("../../models/order/order");
const CampaignModel = require("../../models/campaign/campaign");
const CampaignCostModel = require("../../models/campaign/campaignCost");

// const pagination = require("../../helpers/paginationQuery");
const productQuery = require("../../helpers/productQuery");
const customMetaData = require("../../helpers/customMetaData");

const productProjection = {
  description: 0,
  guideline: 0,
  brandId: 0,
  unit: 0,
  videoUrl: 0,
  chartTitle: 0,
  chartList: 0,
};

// CREATE CAMPAIGN
const createCampaign = async (req, res) => {
  try {
    const campaignData = await CampaignModel.create(req.body);

    if (!campaignData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to create campaign",
      });
    }

    return res.status(201).json({
      data: campaignData,
      success: true,
      message: "Campaign create successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: createCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE CAMPAIGN
const updateCampaign = async (req, res) => {
  try {
    const campaignData = await CampaignModel.findOneAndUpdate(
      {
        _id: req.params.campaignId,
      },
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );

    if (!campaignData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to update campaign",
      });
    }

    return res.status(201).json({
      data: campaignData,
      success: true,
      message: "Campaign update successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: updateCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// DELETE CAMPAIGN
const deleteCampaign = async (req, res) => {
  try {
    const campaignData = await CampaignModel.findOneAndDelete({
      _id: req.params.campaignId,
    });

    if (!campaignData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to delete campaign",
      });
    }

    await CampaignCostModel.deleteMany({ campaignId: req.params.campaignId });

    return res.status(201).json({
      data: campaignData,
      success: true,
      message: "Campaign delete successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: deleteCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE CAMPAIGN
const fetchSingleCampaign = async (req, res) => {
  try {
    const [campaignData] = await CampaignModel.aggregate([
      {
        $match: {
          _id: ObjectId(req.params.campaignId),
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "products",
          foreignField: "_id",
          pipeline: [
            ...productQuery.category(),
            ...productQuery.brand(),
            ...productQuery.sticker(),
            ...productQuery.variations(),
            ...productQuery.nonVariationPurchase(),
            {
              $project: productProjection,
            },
          ],
          as: "products",
        },
      },
    ]);

    if (!campaignData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to single campaign",
      });
    }

    return res.status(201).json({
      data: campaignData,
      success: true,
      message: "Campaign single successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: fetchSingleCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH All CAMPAIGN
const fetchAllCampaign = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {};
    let searchCondition = {};
    let costCondition = {};

    if (req.body.value) {
      searchCondition = {
        name: { $regex: req.body.value, $options: "i" },
      };
    }

    if (req.body.startTime && req.body.endTime) {
      // searchCondition = {
      //   ...searchCondition,
      //   startDate: { $gte: req.body.startTime, $lte: req.body.endTime },
      // };
      matchCondition = {
        ...matchCondition,
        createdAt: { $gte: req.body.startTime, $lte: req.body.endTime },
      };
      costCondition = {
        ...costCondition,
        payTime: { $gte: req.body.startTime, $lte: req.body.endTime },
      };
    }

    const [campaignData, totalData] = await Promise.all([
      CampaignModel.aggregate([
        {
          $match: searchCondition,
        },
        {
          $lookup: {
            from: "campaign_costs",
            let: { cId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$campaignId", "$$cId"],
                  },
                },
              },
              {
                $sort: {
                  payTime: -1,
                },
              },
              {
                $project: {
                  payTime: 1,
                },
              },
              {
                $limit: 1,
              },
            ],
            as: "lastCampaignCost",
          },
        },
        {
          $unwind: {
            path: "$lastCampaignCost",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            lastPayTime: "$lastCampaignCost.payTime",
          },
        },
        {
          $sort: {
            lastPayTime: -1,
          },
        },
        {
          $lookup: {
            from: "orders",
            let: { pIds: "$products", pCreated: "$startDate" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $gte: ["$createdAt", "$$pCreated"],
                      },
                      {
                        $not: {
                          $in: [
                            { $arrayElemAt: ["$orderStatus.status", -1] },
                            ["CANCELED", "PENDING", "HOLD"],
                          ],
                        },
                      },
                    ],
                  },
                },
              },
              {
                $match: matchCondition,
              },
              {
                $project: {
                  products: 1,
                  customerCharge: 1,
                  orderStatus: 1,
                  currentStatus: { $arrayElemAt: ["$orderStatus.status", -1] },
                  returnMoney: 1,
                  refundMoney: 1,
                  isReturn: 1,
                  isRefund: 1,
                },
              },
              {
                $addFields: {
                  orderTotalQty: {
                    $sum: {
                      $map: {
                        input: "$products",
                        as: "product",
                        in: "$$product.quantity",
                      },
                    },
                  },
                },
              },
              {
                $unwind: {
                  path: "$products",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $match: {
                  $expr: {
                    $in: ["$products.productId", "$$pIds"],
                  },
                },
              },
              {
                $addFields: {
                  orderSellPrice: {
                    $subtract: [
                      {
                        $multiply: ["$products.price", "$products.quantity"],
                      },
                      {
                        $multiply: [
                          {
                            $divide: ["$customerCharge.discountPrice", "$orderTotalQty"],
                          },
                          "$products.quantity",
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: "$currentStatus",
                  salePrice: { $sum: "$orderSellPrice" },
                  saleQty: { $sum: "$products.quantity" },
                  returnPrice: { $sum: "$returnMoney" },
                  refundPrice: { $sum: "$refundMoney" },
                  isReturn: { $first: "$isReturn" },
                  isRefund: { $first: "$isRefund" },
                },
              },
              {
                $project: {
                  status: "$_id",
                  salePrice: 1,
                  saleQty: 1,
                  returnMoney: {
                    $cond: {
                      if: {
                        $eq: ["$isReturn", false],
                      },
                      then: "$$REMOVE",
                      else: "$returnPrice",
                    },
                  },
                  refundMoney: {
                    $cond: {
                      if: {
                        $eq: ["$isRefund", false],
                      },
                      then: "$$REMOVE",
                      else: "$refundPrice",
                    },
                  },
                },
              },
            ],
            as: "saleDetails",
          },
        },
        {
          $lookup: {
            from: "purchase_prods",
            let: { pIds: "$products", pCreated: "$startDate" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      // {
                      //   $gte: ["$createdAt", "$$pCreated"],
                      // },
                      {
                        $eq: ["$isReceived", true],
                      },
                      {
                        $in: ["$productId", "$$pIds"],
                      },
                    ],
                  },
                },
              },
              // {
              //   $match: matchCondition,
              // },
              {
                $group: {
                  _id: null,
                  purchasePrice: {
                    $sum: {
                      $multiply: ["$quantity", "$price"],
                    },
                  },
                  totalQty: {
                    $sum: "$quantity",
                  },
                },
              },
            ],
            as: "purchaseCost",
          },
        },
        {
          $unwind: {
            path: "$purchaseCost",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "campaign_costs",
            let: { cId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$campaignId", "$$cId"],
                  },
                },
              },
              {
                $match: costCondition,
              },
              {
                $group: {
                  _id: null,
                  totalCost: { $sum: "$bdtCost" },
                },
              },
            ],
            as: "campaignCost",
          },
        },
        {
          $unwind: {
            path: "$campaignCost",
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
      CampaignModel.countDocuments(),
    ]);
    if (!campaignData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch campaign",
      });
    }

    return res.status(201).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: campaignData,
      success: true,
      message: "Campaign fetch successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: fetchAllCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE CAMPAIGN
const fetchDetailsSingleCampaign = async (req, res) => {
  try {
    const [campaignData] = await CampaignModel.aggregate([
      {
        $match: {
          _id: ObjectId(req.params.campaignId),
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "products",
          foreignField: "_id",
          let: { pId: "$_id", pCreated: "$startDate" },
          pipeline: [
            {
              $addFields: {
                pCreated: "$$pCreated",
              },
            },
            {
              $lookup: {
                from: "orders",
                let: { pId: "$_id", pCreated: "$pCreated" },
                pipeline: [
                  // {
                  //   $match: {
                  //     $expr: {
                  //       $gte: ["$createdAt", "$$pCreated"],
                  //     },
                  //   },
                  // },
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $gte: ["$createdAt", "$$pCreated"],
                          },
                          {
                            $not: {
                              $in: [
                                { $arrayElemAt: ["$orderStatus.status", -1] },
                                ["CANCELED", "PENDING", "HOLD"],
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      products: 1,
                      customerCharge: 1,
                    },
                  },
                  {
                    $addFields: {
                      orderTotalQty: {
                        $sum: {
                          $map: {
                            input: "$products",
                            as: "product",
                            in: "$$product.quantity",
                          },
                        },
                      },
                    },
                  },
                  {
                    $unwind: {
                      path: "$products",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $match: {
                      $expr: {
                        $eq: ["$products.productId", "$$pId"],
                      },
                    },
                  },
                  {
                    $addFields: {
                      orderSellPrice: {
                        $subtract: [
                          {
                            $multiply: ["$products.price", "$products.quantity"],
                          },
                          {
                            $multiply: [
                              {
                                $divide: ["$customerCharge.discountPrice", "$orderTotalQty"],
                              },
                              "$products.quantity",
                            ],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      totalSalePrice: { $sum: "$orderSellPrice" },
                      totalSaleQty: { $sum: "$products.quantity" },
                    },
                  },
                ],
                as: "saleDetails",
              },
            },
            {
              $unwind: {
                path: "$saleDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                name: 1,
                slug: 1,
                sku: 1,
                galleryImage: 1,
                totalSell: 1,
                saleDetails: 1,
              },
            },
          ],
          as: "products",
        },
      },
      {
        $lookup: {
          from: "campaign_costs",
          let: { cId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$campaignId", "$$cId"],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalCost: { $sum: "$bdtCost" },
              },
            },
          ],
          as: "campaignCost",
        },
      },
      {
        $unwind: {
          path: "$campaignCost",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!campaignData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to single campaign",
      });
    }

    return res.status(201).json({
      data: campaignData,
      success: true,
      message: "Campaign single successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: fetchSingleCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE CAMPAIGN
const campaignProductDetails = async (req, res) => {
  try {
    const productOrderData = await OrderModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              // {
              //   $gte: ["$createdAt", req.body.createdTime],
              // },
              {
                $not: {
                  $in: [
                    { $arrayElemAt: ["$orderStatus.status", -1] },
                    ["CANCELED", "PENDING", "HOLD"],
                  ],
                },
              },
            ],
          },
        },
      },
      {
        $project: {
          products: 1,
          customerCharge: 1,
          currentStatus: { $arrayElemAt: ["$orderStatus.status", -1] },
        },
      },
      {
        $addFields: {
          orderTotalQty: {
            $sum: {
              $map: {
                input: "$products",
                as: "product",
                in: "$$product.quantity",
              },
            },
          },
        },
      },
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $expr: {
            $eq: ["$products.productId", ObjectId(req.body.productId)],
          },
        },
      },
      {
        $addFields: {
          orderSellPrice: {
            $subtract: [
              {
                $multiply: ["$products.price", "$products.quantity"],
              },
              {
                $multiply: [
                  {
                    $divide: ["$customerCharge.discountPrice", "$orderTotalQty"],
                  },
                  "$products.quantity",
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$currentStatus",
          totalSalePrice: { $sum: "$orderSellPrice" },
          totalSaleQty: { $sum: "$products.quantity" },
        },
      },
    ]);

    if (!productOrderData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to single campaign",
      });
    }

    return res.status(201).json({
      data: productOrderData,
      success: true,
      message: "Campaign single successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: campaignProductDetails ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ADD CAMPAIGN COST
const addCampaignCost = async (req, res) => {
  try {
    const campaignCostData = await CampaignCostModel.create(req.body);
    if (!campaignCostData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to single campaign",
      });
    }

    return res.status(201).json({
      data: campaignCostData,
      success: true,
      message: "Campaign single successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: fetchSingleCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// UPDATE CAMPAIGN COST
const updateCampaignCost = async (req, res) => {
  try {
    const campaignCostData = await CampaignCostModel.findOneAndUpdate(
      {
        _id: req.params.campaignCostId,
      },
      { $set: req.body },
      { new: true }
    );

    if (!campaignCostData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to single campaign",
      });
    }

    return res.status(201).json({
      data: campaignCostData,
      success: true,
      message: "Campaign single successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: fetchSingleCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// DELETE CAMPAIGN COST
const deleteCampaignCost = async (req, res) => {
  try {
    const campaignCostData = await CampaignCostModel.findOneAndDelete({
      _id: req.params.campaignCostId,
    });

    if (!campaignCostData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to single campaign",
      });
    }

    return res.status(201).json({
      data: campaignCostData,
      success: true,
      message: "Campaign single successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: fetchSingleCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

//  CAMPAIGN COST LIST
const fetchCampaignCost = async (req, res) => {
  try {
    const campaignCostData = await CampaignCostModel.find({
      campaignId: req.params.campaignId,
    }).sort({ createdAt: -1 });

    if (!campaignCostData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to single campaign",
      });
    }

    return res.status(201).json({
      data: campaignCostData,
      success: true,
      message: "Campaign single successfully.",
    });
  } catch (err) {
    console.log("*** campaignController: fetchSingleCampaign ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  fetchSingleCampaign,
  fetchAllCampaign,
  fetchDetailsSingleCampaign,
  campaignProductDetails,

  addCampaignCost,
  updateCampaignCost,
  deleteCampaignCost,
  fetchCampaignCost,
};
