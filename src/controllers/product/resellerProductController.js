const ProductModel = require("../../models/product/product");
const CategoryModel = require("../../models/product/category");
const customMetaData = require("../../helpers/customMetaData");
const { resellerProductCard, resellerProductFull } = require("../../helpers/productAssists");

// FETCH ALL PRODUCTS
const fetchAllProductsByReseller = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {
      isDeleted: { $eq: false },
      isReseller: { $eq: true },
      isOwnDisabled: { $eq: false },
    };

    if (req.body.prodType === "FEATURED") {
      matchCondition = {
        ...matchCondition,
        isFeatured: true,
      };
    } else if (req.body.prodType === "NON_FEATURED") {
      matchCondition = {
        ...matchCondition,
        isFeatured: false,
      };
    } else if (req.body.prodType === "PUBLISH") {
      matchCondition = {
        ...matchCondition,
        isOwnDisabled: false,
      };
    } else if (req.body.prodType === "UNPUBLISH") {
      matchCondition = {
        ...matchCondition,
        isOwnDisabled: true,
      };
    } else if (req.body.prodType === "TOP_POS") {
      matchCondition = {
        ...matchCondition,
        isPosSuggest: true,
      };
    } else if (req.body.prodType === "FLASH") {
      matchCondition = {
        ...matchCondition,
        isFlashDeal: true,
      };
    }

    if (req.body.categorySlug !== "") {
      const categoryData = await CategoryModel.aggregate([
        {
          $match: {
            slug: req.body.categorySlug,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "parentId",
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
                      },
                    },
                  ],
                  as: "children",
                },
              },
              {
                $project: {
                  _id: 1,
                  children: 1,
                },
              },
            ],
            as: "children",
          },
        },
        {
          $project: {
            _id: 1,
            children: 1,
          },
        },
      ]);

      const categoryIds = [];
      categoryData.forEach((cat) => {
        categoryIds.push(cat?._id);
        cat?.children.forEach((subChild) => {
          categoryIds.push(subChild?._id);
          subChild?.children.forEach((subSubChild) => {
            categoryIds.push(subSubChild?._id);
          });
        });
      });

      if (categoryIds.length > 0) {
        matchCondition = {
          ...matchCondition,
          categories: {
            $in: categoryIds,
          },
        };
      }
    }

    const aggregationPipeline = [
      {
        $match: matchCondition,
      },
    ];

    let sortCondition = {};

    if (req.body.sort === "NEW_TO_OLD") {
      sortCondition = {
        ...sortCondition,
        createdAt: -1,
      };
    } else if (req.body.sort === "OLD_TO_NEW") {
      sortCondition = {
        ...sortCondition,
        createdAt: 1,
      };
    } else if (req.body.sort === "LH_SELL") {
      sortCondition = {
        ...sortCondition,
        totalSell: 1,
      };
    } else if (req.body.sort === "HL_SELL") {
      sortCondition = {
        ...sortCondition,
        totalSell: -1,
      };
    }

    if (Object.keys(sortCondition).length > 0) {
      aggregationPipeline.push({
        $sort: sortCondition,
      });
    }

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        ...aggregationPipeline,
        ...resellerProductCard,
        {
          $project: {
            description: 0,
            guideline: 0,
            brandId: 0,
            unit: 0,
            videoUrl: 0,
            chartTitle: 0,
            chartList: 0,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ProductModel.countDocuments(matchCondition),
    ]);

    if (!productsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch admin all products!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productsData,
      message: "Fetch admin all products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchAllProductsByReseller ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// SEARCH PRODUCTS BY SKU OR NAME
const searchProductsBySkuOrName = async (req, res) => {
  try {
    req.body.value = req.body.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchObj = {
      $and: [
        {
          isDeleted: { $eq: false },
        },
        {
          isOwnDisabled: { $eq: false },
        },
        {
          isReseller: { $eq: true },
        },
        {
          $or: [
            { name: { $regex: req.body.value, $options: "i" } },
            { sku: { $regex: req.body.value, $options: "i" } },
          ],
        },
      ],
    };

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: matchObj,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...resellerProductCard,
        {
          $project: {
            description: 0,
            guideline: 0,
            brandId: 0,
            unit: 0,
            videoUrl: 0,
            chartTitle: 0,
            chartList: 0,
            nonVariation: {
              purchaseQty: 0,
              totalPurchasePrice: 0,
            },
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ProductModel.countDocuments(matchObj),
    ]);

    if (!productsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch all products!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productsData,
      message:
        productsData[0]?.data?.length <= 0
          ? "No product found!"
          : "Fetch all products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: searchProductsBySkuOrName ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH POS PRODUCTS
const fetchPosProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      $and: [
        { isDeleted: { $eq: false } },
        { isReseller: { $eq: true } },
        {
          isOwnDisabled: { $eq: false },
        },
      ],
    };

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $sort: {
            isPosSuggest: -1,
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: "variations",
            localField: "variations",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  isDisabled: false,
                },
              },
              {
                $lookup: {
                  from: "attribute_opts",
                  localField: "attributeOpts",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $lookup: {
                        from: "attributes",
                        localField: "attributeId",
                        foreignField: "_id",
                        pipeline: [
                          {
                            $project: {
                              name: 1,
                            },
                          },
                        ],
                        as: "attribute",
                      },
                    },
                    {
                      $unwind: {
                        path: "$attribute",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $project: {
                        name: 1,
                        attributeId: "$attribute._id",
                        attributeName: "$attribute.name",
                      },
                    },
                  ],
                  as: "attributeOpts",
                },
              },
              {
                $project: {
                  attributeOpts: 1,
                  images: 1,
                  stock: 1,
                  regularPrice: 1,
                  sellingPrice: 1,
                  discount: 1,
                  flashPrice: 1,
                  isDisabled: 1,
                },
              },
            ],
            as: "variations",
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            sku: 1,
            galleryImage: 1,
            isVariant: 1,
            isFlashDeal: 1,
            variations: 1,
            nonVariation: {
              stock: 1,
              regularPrice: 1,
              sellingPrice: 1,
              flashPrice: 1,
            },
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ProductModel.countDocuments(matchCondition),
    ]);

    if (!productsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch admin all products!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productsData,
      message:
        productsData[0]?.data?.length <= 0
          ? "No data found!"
          : "Fetch admin all products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchAllProducts ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE PRODUCT
const viewProduct = async (req, res) => {
  try {
    const [productData] = await ProductModel.aggregate([
      {
        $match: {
          $and: [
            {
              isDeleted: { $eq: false },
            },
            { isReseller: { $eq: true } },
            {
              isOwnDisabled: { $eq: false },
            },
            {
              slug: { $eq: req.params.productSlug },
            },
          ],
        },
      },
      ...resellerProductFull,
      {
        $project: {
          nonVariation: {
            purchaseQty: 0,
            totalPurchasePrice: 0,
            sellQty: 0,
            totalSellPrice: 0,
          },
        },
      },
    ]);

    if (!productData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch product!",
        success: false,
      });
    }

    return res.status(200).json({
      data: productData,
      message: "Fetch product successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: viewProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ================

module.exports = {
  // LIST

  fetchAllProductsByReseller,
  searchProductsBySkuOrName,
  fetchPosProducts,
  viewProduct,
};
