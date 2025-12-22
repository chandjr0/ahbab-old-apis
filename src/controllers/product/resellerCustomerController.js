const mongoose = require("mongoose");
const ProductModel = require("../../models/product/product");
const CategoryModel = require("../../models/product/category");
const BrandModel = require("../../models/product/brand");
const customMetaData = require("../../helpers/customMetaData");
const {
  resellerCustomerProductCard,
  resellerCustomerProductFull,
  transformFlatFieldsToArrays,
} = require("../../helpers/productAssists");

const { ObjectId } = mongoose.Types;

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

// FETCH ALL PRODUCTS
const fetchAllProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            $and: [
              { isDeleted: { $eq: false } },
              { isOwnDisabled: { $eq: false } },
              { isReseller: { $eq: true } },
            ],
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...resellerCustomerProductFull,
        ...transformFlatFieldsToArrays,
        {
          $project: productProjection,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ProductModel.countDocuments({
        $and: [
          { isDeleted: { $eq: false } },
          { isOwnDisabled: { $eq: false } },
          { isReseller: { $eq: true } },
        ],
      }),
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
    console.log("*** productController: fetchAllProducts ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ALL BEST PRODUCTS
const fetchAllBestProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      isOwnDisabled: { $eq: false },
      isFlashDeal: { $eq: false },
      isDeleted: { $eq: false },
      isReseller: { $eq: true },
    };

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $sort: {
            totalSell: -1,
          },
        },
        ...resellerCustomerProductCard,
        ...transformFlatFieldsToArrays,
        {
          $project: productProjection,
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
    console.log("*** productController: fetchAllBestProducts ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ALL FEATURE PRODUCTS
const fetchAllFeatureProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      isOwnDisabled: { $eq: false },
      isFlashDeal: { $eq: false },
      isDeleted: { $eq: false },
      isFeatured: { $eq: true },
      isReseller: { $eq: true },
    };

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...resellerCustomerProductCard,
        ...transformFlatFieldsToArrays,
        {
          $project: productProjection,
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
        message: "Failed to fetch feature products!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productsData,
      message: "Fetch feature products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchAllFeatureProducts ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ALL FLASH PRODUCTS
const fetchAllFlashProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      isOwnDisabled: { $eq: false },
      isFlashDeal: { $eq: true },
      isDeleted: { $eq: false },
      isReseller: { $eq: true },
    };

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...resellerCustomerProductCard,
        ...transformFlatFieldsToArrays,
        {
          $project: productProjection,
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
    console.log("*** productController: fetchAllFlashProducts ***");
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
        { isOwnDisabled: { $eq: false } },
        { isReseller: { $eq: true } },
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
        ...resellerCustomerProductFull,
        ...transformFlatFieldsToArrays,
        {
          $project: productProjection,
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

// FETCH ALL CATEGORY PRODUCTS
const fetchAllProductByCategory = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const categoryData = await CategoryModel.aggregate([
      {
        $match: {
          slug: req.params.categorySlug,
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

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            categories: {
              $in: categoryIds,
            },
            isDeleted: { $eq: false },
            isOwnDisabled: { $eq: false },
            isReseller: { $eq: true },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...resellerCustomerProductCard,
        ...transformFlatFieldsToArrays,
        {
          $project: productProjection,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ProductModel.countDocuments({
        categories: {
          $in: categoryIds,
        },
        isDeleted: { $eq: false },
        isOwnDisabled: { $eq: false },
        isReseller: { $eq: true },
      }),
    ]);

    if (!productsData) {
      return res.status(400).json({
        data: null,
        message: "No product found in this category.",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productsData,
      message:
        productsData[0]?.data?.length <= 0
          ? "No data found!"
          : "Fetched all products by category successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchAllProductByCategory ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH ALL BRAND PRODUCTS
const fetchAllProductByBrand = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const branchData = await BrandModel.findOne(
      {
        $slug: req.params.brandSlug,
      },
      { _id: 1 }
    );

    if (!branchData) {
      return res.status(400).json({
        data: null,
        message: "Invalid brand",
        success: false,
      });
    }

    const [productData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            $and: [
              { brandId: { $eq: ObjectId(branchData?._id) } },
              { isDeleted: { $eq: false } },
              { isOwnDisabled: { $eq: false } },
              { isReseller: { $eq: true } },
            ],
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...resellerCustomerProductCard,
        ...transformFlatFieldsToArrays,
        {
          $project: productProjection,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ProductModel.countDocuments({
        $and: [
          { brandId: { $eq: ObjectId(branchData?._id) } },
          { isDeleted: { $eq: false } },
          { isOwnDisabled: { $eq: false } },
          { isReseller: { $eq: true } },
        ],
      }),
    ]);

    if (productData?.length <= 0) {
      return res.status(400).json({
        data: null,
        message: "No product found in this brand.",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productData,
      message: "Fetched all products by brand successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchAllProductByBrand ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: [],
      success: true,
      message: "Internal Server Error Occurred.",
    });
  }
};

// VIEW PRODUCT
const viewProduct = async (req, res) => {
  try {
    const [productData] = await ProductModel.aggregate([
      {
        $match: {
          $and: [
            { isOwnDisabled: { $eq: false } },
            {
              isDeleted: { $eq: false },
            },
            { isReseller: { $eq: true } },
            {
              slug: { $eq: req.params.productSlug },
            },
          ],
        },
      },
      ...resellerCustomerProductFull,
      {
        $project: {
          ...productProjection,
          description: 1,
          guideline: 1,
          brand: 1,
          categories: 1,
          unit: 1,
          videoUrl: 1,
          chartTitle: 1,
          chartList: 1,
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
    console.log("*** productController: fetchSingleProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// VIEW PRODUCT WITH SIMILAR PRODUCT
const viewProductWithSimilarProduct = async (req, res) => {
  try {
    const LIMIT_OF_SIMILAR_PRODUCT = Math.max(1, req.query.similarLimit) || 1;

    const [productData] = await ProductModel.aggregate([
      {
        $match: {
          $and: [
            { isOwnDisabled: { $eq: false } },
            {
              isDeleted: { $eq: false },
            },
            { isReseller: { $eq: true } },
            {
              slug: { $eq: req.params.productSlug },
            },
          ],
        },
      },
      ...resellerCustomerProductFull,
      {
        $project: {
          ...productProjection,
          description: 1,
          guideline: 1,
          brand: 1,
          categories: 1,
          unit: 1,
          videoUrl: 1,
          chartTitle: 1,
          chartList: 1,
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

    let similarProducts = [];
    if (productData?.categories && productData?.categories.length > 0) {
      similarProducts = await ProductModel.aggregate([
        {
          $match: {
            $and: [
              { isOwnDisabled: { $eq: false } },
              {
                isDeleted: { $eq: false },
              },
              { isReseller: { $eq: true } },
              {
                slug: { $ne: req.params.productSlug },
              },
              { categories: { $in: productData?.categories.map((i) => ObjectId(i?._id)) } },
            ],
          },
        },
        ...resellerCustomerProductCard,
        ...transformFlatFieldsToArrays,
        {
          $project: productProjection,
        },
        {
          $limit: LIMIT_OF_SIMILAR_PRODUCT,
        },
      ]);
    }

    return res.status(200).json({
      data: { ...productData, similarProducts },
      message: "Fetch product successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchSingleProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// CHECK PRODUCT STOCK
const checkProductStock = async (req, res) => {
  try {
    const [productData] = await ProductModel.aggregate([
      {
        $match: {
          $and: [
            { isOwnDisabled: { $eq: false } },
            {
              isDeleted: { $eq: false },
            },
            { isReseller: { $eq: true } },
            {
              _id: { $eq: ObjectId(req.body.productId) },
            },
          ],
        },
      },
      ...resellerCustomerProductFull,
      {
        $project: productProjection,
      },
    ]);

    if (!productData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch product!",
        success: false,
      });
    }

    if (
      (productData?.isVariant && req.body.variationId === "") ||
      (!productData?.isVariant && req.body.variationId !== "")
    ) {
      return res.status(400).json({
        data: null,
        message: "Invalid product!",
        success: false,
      });
    }

    let productObj = req.body;

    if (!productData?.isVariant) {
      productObj = {
        ...productObj,
        stock: productData?.nonVariation?.stock,
        sellingPrice: productData?.nonVariation?.sellingPrice,
      };
    } else {
      const variantData = productData?.variations.find(
        (item) => String(item?._id) === String(req.body.variationId)
      );
      productObj = {
        ...productObj,
        stock: variantData?.stock,
        sellingPrice: variantData?.sellingPrice,
      };
    }

    return res.status(200).json({
      data: productObj,
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

  fetchAllProducts,
  fetchAllBestProducts,
  fetchAllFlashProducts,
  fetchAllFeatureProducts,
  searchProductsBySkuOrName,
  fetchAllProductByCategory,
  fetchAllProductByBrand,
  viewProduct,
  viewProductWithSimilarProduct,
  checkProductStock,
};
