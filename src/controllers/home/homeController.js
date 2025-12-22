const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const HomeModel = require("../../models/home/home");
const CategoryModel = require("../../models/product/category");
const SettingsModel = require("../../models/settings/setting");
// const productQuery = require("../../helpers/productQuery");
// const { redisClient } = require("../../redis");
const { adminCustomerProductCard, transformFlatFieldsToArrays } = require("../../helpers/productAssists");

const ProductModel = require("../../models/product/product");

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

const comboProjection = {
  name: 1,
  slug: 1,
  sku: 1,
  galleryImage: 1,
  regularPrice: 1,
  sellingPrice: 1,
};

// FETCH HOME OPTIONS
const fetchHomeOptions = async (req, res) => {
  try {
    const homeData = await HomeModel.aggregate([
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
      return res.status(400).json({
        data: null,
        message: "Failed to fetch home!",
        success: false,
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
        { deviceType: "web", resellerId: null },
        { $set: req.body.forWeb },
        { new: true, upsert: true }
      ),
      await HomeModel.findOneAndUpdate(
        { deviceType: "mobile", resellerId: null },
        { $set: req.body.forMobile },
        { new: true, upsert: true }
      ),
    ]);

    const homeData = await HomeModel.find({ resellerId: null });

    if (!homeData) {
      return res.status(400).json({
        data: null,
        message: "Failed to update home!",
        success: false,
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
    const CATEGORY_PRODUCT_PAGE_LIMIT = 12;
    const COMBO_PRODUCT_PAGE_LIMIT = 5;

    const [[homeData], categoryData] = await Promise.all([
      HomeModel.aggregate([
        {
          $match: {
            resellerId: null,
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
                  isFeatured: 1,
                  children: 1,
                },
              },
            ],
            as: "categories",
          },
        },
      ]),
      CategoryModel.aggregate([
        {
          $match: { 
            $or: [
              { isFeatured: true },
              { isFeatured: "true" },
              { isFeatured: "True" },
              { isFeatured: "TRUE" },
            ],
          },
        },
        {
          $lookup: {
            from: "products",
            let: { categoryIds: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ["$$categoryIds", "$categories"] },
                      { 
                        $or: [
                          { $eq: ["$isOwnDisabled", false] },
                          { $eq: ["$isOwnDisabled", "false"] },
                          { $eq: ["$isOwnDisabled", null] },
                          { $eq: [{ $type: "$isOwnDisabled" }, "missing"] },
                        ],
                      },
                      { 
                        $or: [
                          { $eq: ["$isDeleted", false] },
                          { $eq: ["$isDeleted", "false"] },
                          { $eq: ["$isDeleted", null] },
                          { $eq: [{ $type: "$isDeleted" }, "missing"] },
                        ],
                      },
                      { 
                        $or: [
                          { $eq: ["$isActive", true] },
                          { $eq: ["$isActive", "true"] },
                          { $eq: ["$isActive", "True"] },
                          { $eq: ["$isActive", "TRUE"] },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $sort: { createdAt: -1 },
              },
              ...adminCustomerProductCard,
              ...transformFlatFieldsToArrays,
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
            image: 1,
            imageForCategoryProduct: 1,
            imageForHomePage: 1,
            products: 1,
          },
        },
      ]),
    ]);

    const aggregateArray = [];

    if (homeData?.flashProduct) {
      const flashObj = {
        $lookup: {
          from: "products",
          pipeline: [
            {
              $match: {
                isOwnDisabled: { $in: [false, "false", null] },
                isFlashDeal: { $in: [true, "true", "True", "TRUE", 1] },
                isDeleted: { $in: [false, "false", null] },
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
                isOwnDisabled: { $in: [false, "false", null] },
                isFlashDeal: { $in: [false, "false", null] },
                isDeleted: { $in: [false, "false", null] },
                isFeatured: { $in: [true, "true", "True", "TRUE"] },
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
                isOwnDisabled: { $in: [false, "false", null] },
                isFlashDeal: { $in: [false, "false", null] },
                isDeleted: { $in: [false, "false", null] },
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

    if (homeData?.comboProducts) {
      const comboProductsObj = {
        $lookup: {
          from: "combos",
          pipeline: [
            {
              $match: {
                isOwnDisabled: { $eq: false },
                isDeleted: { $eq: false },
              },
            },
            {
              $sort: {
                isFeatured: -1,
                createdAt: -1,
              },
            },
            {
              $project: comboProjection,
            },
            {
              $limit: COMBO_PRODUCT_PAGE_LIMIT,
            },
          ],
          as: "comboProducts",
        },
      };
      aggregateArray.push(comboProductsObj);
    } else {
      const comboProductsObj = {
        $addFields: {
          comboProducts: [],
        },
      };
      aggregateArray.push(comboProductsObj);
    }

    const allCategoryIds = homeData?.categories.map((cat) => {
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
          resellerId: null,
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

    const categoryProducts = [];
    if (homeData?.categories) {
      for (let i = 0; homeData?.categories.length > i; i++) {
        categoryProducts.push(allHomeData?.[`category${i + 1}`]);
      }
    }

    const topFiveFeaturedCategory = await CategoryModel.find({ featuredSerial: { $ne: 0 } }, { image: 1, imageForCategoryProduct: 1, imageForHomePage: 1, slug: 1, name: 1 }).sort({featuredSerial:1});
    const modifyAllData = {
      flashProducts: allHomeData?.flashProducts || [],
      featureProducts: allHomeData?.featureProducts || [],
      bestProducts: allHomeData?.bestProducts || [],
      comboProducts: allHomeData?.comboProducts || [],
      categoryProducts: categoryProducts.filter(Boolean),
      categoryData: categoryData || [],
      featuredCategory: categoryData || [],
      topFiveFeaturedCategory: topFiveFeaturedCategory || []
    };

    return res.status(200).json({
      data: modifyAllData,
      message: "All home products successfully!",
      success: true,
    });
  } catch (err) {
    console.log('home page data view error ===================== ', err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH All HOME DATA FOR RESELLER
const fetchAllHomeDataForReseller = async (req, res) => {
  try {
    const FLASH_PRODUCT_PAGE_LIMIT = 5;
    const FEATURE_PRODUCT_PAGE_LIMIT = 5;
    const BEST_PRODUCT_PAGE_LIMIT = 10;
    const CATEGORY_PRODUCT_PAGE_LIMIT = 5;

    const [homeData] = await HomeModel.aggregate([
      {
        $match: {
          resellerId: null,
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
                isReseller: { $in: [true, "true", "True", "TRUE", 1] },
                isOwnDisabled: { $in: [false, "false", null] },
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
                isReseller: { $eq: true },
                isOwnDisabled: { $in: [false, "false", null] },
                isFlashDeal: { $in: [false, "false", null] },
                isDeleted: { $in: [false, "false", null] },
                isFeatured: { $in: [true, "true", "True", "TRUE"] },
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
                isReseller: { $eq: true },
                isOwnDisabled: { $in: [false, "false", null] },
                isFlashDeal: { $in: [false, "false", null] },
                isDeleted: { $in: [false, "false", null] },
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

    const allCategoryIds = homeData?.categories.map((cat) => {
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
                        isReseller: { $eq: true },
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
          resellerId: null,
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
      return res.status(400).json({
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

// FETCH All HOME DATA
const fetchAllHomeDataForResellerV2 = async (req, res) => {
  try {
    const FLASH_PRODUCT_PAGE_LIMIT = 5;
    const FEATURE_PRODUCT_PAGE_LIMIT = 5;
    const BEST_PRODUCT_PAGE_LIMIT = 10;
    const COMBO_PRODUCT_PAGE_LIMIT = 5;
    const CATEGORY_PRODUCT_PAGE_LIMIT = 5;

    const [[homeData], categoryData] = await Promise.all([
      HomeModel.aggregate([
        {
          $match: {
            resellerId: null,
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
                  isFeatured: 1,
                  children: 1,
                },
              },
            ],
            as: "categories",
          },
        },
      ]),
      CategoryModel.find({ 
        $or: [
          { isFeatured: true },
          { isFeatured: "true" },
          { isFeatured: "True" },
          { isFeatured: "TRUE" },
        ],
      }, { name: 1, slug: 1, image: 1 }).sort({
        name: 1,
      }),
    ]);

    const aggregateArray = [];

    if (homeData?.flashProduct) {
      const flashObj = {
        $lookup: {
          from: "products",
          pipeline: [
            {
              $match: {
                isReseller: { $in: [true, "true", "True", "TRUE", 1] },
                isOwnDisabled: { $in: [false, "false", null] },
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
                isReseller: { $eq: true },
                isOwnDisabled: { $in: [false, "false", null] },
                isFlashDeal: { $in: [false, "false", null] },
                isDeleted: { $in: [false, "false", null] },
                isFeatured: { $in: [true, "true", "True", "TRUE"] },
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
                isReseller: { $eq: true },
                isOwnDisabled: { $in: [false, "false", null] },
                isFlashDeal: { $in: [false, "false", null] },
                isDeleted: { $in: [false, "false", null] },
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

    if (homeData?.comboProducts) {
      const comboProductsObj = {
        $lookup: {
          from: "combos",
          pipeline: [
            {
              $match: {
                isReseller: { $in: [true, "true", "True", "TRUE", 1] },
                isOwnDisabled: { $in: [false, "false", null] },
                isDeleted: { $eq: false },
              },
            },
            {
              $sort: {
                isFeatured: -1,
                createdAt: -1,
              },
            },
            {
              $project: comboProjection,
            },
            {
              $limit: COMBO_PRODUCT_PAGE_LIMIT,
            },
          ],
          as: "comboProducts",
        },
      };
      aggregateArray.push(comboProductsObj);
    } else {
      const comboProductsObj = {
        $addFields: {
          comboProducts: [],
        },
      };
      aggregateArray.push(comboProductsObj);
    }

    const allCategoryIds = homeData?.categories.map((cat) => {
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
                        isReseller: { $eq: true },
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
          resellerId: null,
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
      return res.status(400).json({
        data: null,
        message: "Failed to fetch home products!",
        success: true,
      });
    }

    const categoryProducts = [];
    for (let i = 0; homeData?.categories.length > i; i++) {
      categoryProducts.push(allHomeData[`category${i + 1}`]);
    }

    const modifyAllData = {
      flashProducts: allHomeData.flashProducts,
      featureProducts: allHomeData.featureProducts,
      bestProducts: allHomeData.bestProducts,
      comboProducts: allHomeData.comboProducts,
      categoryProducts,
      categoryData,
    };

    return res.status(200).json({
      data: modifyAllData,
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
    const settingsData = await SettingsModel.findOne({}, { colors: 1 });

    if (!settingsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch colors!",
        success: false,
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

// FETCH All HOME DATA
const test = async (req, res) => {
  try {
    const productData = await ProductModel.aggregate([
      {
        $lookup: {
          from: "variations",
          localField: "_id",
          foreignField: "productId",
          pipeline: [
            {
              $project: {
                stock: 1,
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: "$stock" },
              },
            },
          ],
          as: "variationdata",
        },
      },
      {
        $unwind: {
          path: "$variationdata",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          variationdata: 1,
          "nonVariation.stock": 1,
          totalStock: { $sum: ["$variationdata.count", "$nonVariation.stock"] },
        },
      },
    ]);

    const productBulkData = [];
    productData.forEach((prod) => {
      productBulkData.push({
        updateOne: {
          filter: { _id: ObjectId(prod?._id) },
          update: {
            $set: {
              totalStock: prod?.totalStock,
            },
          },
        },
      });
    });

    return res.json({ msg: "test..", productBulkData, productData });
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
  fetchAllHomeDataForReseller,
  fetchAllHomeDataForResellerV2,
  fetchSiteColor,
  test,
};
