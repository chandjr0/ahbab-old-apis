const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const HomeModel = require("../../models/home/home");
const SettingsModel = require("../../models/settings/setting");
// const productQuery = require("../../helpers/productQuery");
// const { redisClient } = require("../../redis");
const { adminCustomerProductCard } = require("../../helpers/productAssists");

const productProjection = {
  name: 1,
  slug: 1,
  sku: 1,
  sticker: 1,
  galleryImage: 1,
  isFlashDeal: 1,
  isVariant: 1,
  nonVariation: {
    stock: 1,
    regularPrice: 1,
    sellingPrice: 1,
    discount: 1,
    flashPrice: 1,
  },
  variations: 1,
};

// FETCH HOME OPTIONS
const fetchHomeOptions = async (req, res) => {
  try {
    const homeData = await HomeModel.aggregate([
      {
        $match: {
          resellerId: ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                slug: 1,
              },
            },
          ],
          as: "categories",
        },
      },
    ]);

    if (!homeData) {
      res.status(400).json({
        data: null,
        message: "Failed to fetch home!",
        success: true,
      });
    }

    return res.status(200).json({
      data: homeData,
      message: "fetch home successfully!",
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

// UPDATE HOME OPTIONS
const updateHomeOptions = async (req, res) => {
  try {
    await Promise.all([
      await HomeModel.findOneAndUpdate(
        { deviceType: "web", resellerId: ObjectId(req.user._id) },
        { $set: req.body.forWeb },
        { new: true, upsert: true }
      ),
      await HomeModel.findOneAndUpdate(
        { deviceType: "mobile", resellerId: ObjectId(req.user._id) },
        { $set: req.body.forMobile },
        { new: true, upsert: true }
      ),
    ]);

    const homeData = await HomeModel.find({ resellerId: ObjectId(req.user._id) });

    if (!homeData) {
      res.status(400).json({
        data: null,
        message: "Failed to update home!",
        success: true,
      });
    }

    return res.status(200).json({
      data: homeData,
      message: "Update home successfully!",
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

// FETCH All HOME DATA
const fetchAllHomeData = async (req, res) => {
  try {
    const FLASH_PRODUCT_PAGE_LIMIT = 5;
    const FEATURE_PRODUCT_PAGE_LIMIT = 5;
    const BEST_PRODUCT_PAGE_LIMIT = 10;
    const CATEGORY_PRODUCT_PAGE_LIMIT = 5;

    const [homeData] = await HomeModel.aggregate([
      {
        $match: {
          resellerId: ObjectId(req.reseller._id),
          deviceType: req.query.inWhere,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "parentId",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      slug: 1,
                    },
                  },
                ],
                as: "children",
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                slug: 1,
                children: 1,
              },
            },
          ],
          as: "categories",
        },
      },
    ]);

    const aggregateArray = [];

    if (homeData?.flashProduct) {
      const flashObj = {
        $lookup: {
          from: "products",
          pipeline: [
            {
              $match: {
                isOwnDisabled: { $eq: false },
                isFlashDeal: { $eq: true },
                isDeleted: { $eq: false },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            ...adminCustomerProductCard,
            {
              $project: productProjection,
            },
            {
              $limit: FLASH_PRODUCT_PAGE_LIMIT,
            },
          ],
          as: "flashProducts",
        },
      };
      aggregateArray.push(flashObj);
    } else {
      const flashObj = {
        $addFields: {
          flashProducts: [],
        },
      };
      aggregateArray.push(flashObj);
    }

    if (homeData?.featureProducts) {
      const featureProductsObj = {
        $lookup: {
          from: "products",
          pipeline: [
            {
              $match: {
                isOwnDisabled: { $eq: false },
                isFlashDeal: { $eq: false },
                isDeleted: { $eq: false },
                isFeatured: { $eq: true },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            ...adminCustomerProductCard,
            {
              $project: productProjection,
            },
            {
              $limit: FEATURE_PRODUCT_PAGE_LIMIT,
            },
          ],
          as: "featureProducts",
        },
      };
      aggregateArray.push(featureProductsObj);
    } else {
      const featureProductsObj = {
        $addFields: {
          featureProducts: [],
        },
      };
      aggregateArray.push(featureProductsObj);
    }

    if (homeData?.bestProducts) {
      const bestProductsObj = {
        $lookup: {
          from: "products",
          pipeline: [
            {
              $match: {
                isOwnDisabled: { $eq: false },
                isFlashDeal: { $eq: false },
                isDeleted: { $eq: false },
              },
            },
            {
              $sort: {
                totalSell: -1,
              },
            },
            ...adminCustomerProductCard,
            {
              $project: productProjection,
            },
            {
              $limit: BEST_PRODUCT_PAGE_LIMIT,
            },
          ],
          as: "bestProducts",
        },
      };
      aggregateArray.push(bestProductsObj);
    } else {
      const bestProductsObj = {
        $addFields: {
          bestProducts: [],
        },
      };
      aggregateArray.push(bestProductsObj);
    }

    const allCategoryIds = homeData.categories.map((cat) => {
      const catIds = [];
      catIds.push(cat?._id);
      cat?.children.forEach((subChild) => {
        catIds.push(subChild?._id);
      });
      return catIds;
    });

    homeData?.categories.forEach((data, idx) => {
      const categoryObj = [
        {
          $lookup: {
            from: "categories",
            pipeline: [
              {
                $match: {
                  _id: ObjectId(data?._id),
                },
              },
              {
                $lookup: {
                  from: "products",
                  pipeline: [
                    {
                      $match: {
                        isOwnDisabled: { $eq: false },
                        isDeleted: { $eq: false },
                        categories: {
                          $in: allCategoryIds[idx],
                        },
                      },
                    },
                    {
                      $sort: {
                        createdAt: -1,
                      },
                    },
                    ...adminCustomerProductCard,
                    {
                      $project: productProjection,
                    },
                    {
                      $limit: CATEGORY_PRODUCT_PAGE_LIMIT,
                    },
                  ],
                  as: "products",
                },
              },
              {
                $project: {
                  name: 1,
                  slug: 1,
                  products: 1,
                },
              },
            ],
            as: `category${idx + 1}`,
          },
        },
        {
          $unwind: {
            path: `$category${idx + 1}`,
            preserveNullAndEmptyArrays: true,
          },
        },
      ];
      aggregateArray.push(...categoryObj);
    });

    const [allHomeData] = await HomeModel.aggregate([
      {
        $match: {
          resellerId: ObjectId(req.reseller._id),
          deviceType: req.query.inWhere,
        },
      },
      ...aggregateArray,
      {
        $project: {
          deviceType: 0,
          flashProduct: 0,
          categories: 0,
          createdAt: 0,
          updatedAt: 0,
          newProducts: 0,
          __v: 0,
        },
      },
    ]);

    if (!allHomeData) {
      res.status(400).json({
        data: null,
        message: "Failed to fetch home products!",
        success: true,
      });
    }

    return res.status(200).json({
      data: allHomeData,
      message: "All home products successfully!",
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

const fetchSiteColor = async (req, res) => {
  try {
    const settingsData = await SettingsModel.findOne(
      {
        resellerId: ObjectId(req.reseller._id),
      },
      { colors: 1 }
    );

    if (!settingsData) {
      res.status(400).json({
        data: null,
        message: "Failed to fetch colors!",
        success: true,
      });
    }

    return res.status(200).json({
      data: settingsData,
      message: "fetch colors successfully!",
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
  fetchHomeOptions,
  updateHomeOptions,
  fetchAllHomeData,
  fetchSiteColor,
};
