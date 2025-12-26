const mongoose = require("mongoose");
const ProductModel = require("../../models/product/product");
const CategoryModel = require("../../models/product/category");
const BrandModel = require("../../models/product/brand");
const customMetaData = require("../../helpers/customMetaData");

const {
  adminCustomerProductFull,
  adminCustomerProductCard,
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
            $and: [{ isDeleted: { $eq: false } }, { isOwnDisabled: { $eq: false } }],
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...adminCustomerProductCard,
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
        $and: [{ isDeleted: { $eq: false } }, { isOwnDisabled: { $eq: false } }],
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

// FETCH ALL BEST PRODUCTS
const fetchAllBestProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = {
      isOwnDisabled: { $eq: false },
      isFlashDeal: { $eq: false },
      isDeleted: { $eq: false },
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
        ...adminCustomerProductCard,
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

// FETCH ALL NEW ARRIVAL PRODUCTS
const fetchAllNewArrivalProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 12;

    const matchCondition = {
      isOwnDisabled: { $in: [false, "false", null] },
      isDeleted: { $in: [false, "false", null] },
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
        ...adminCustomerProductCard,
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
          : "Fetch admin all new arrival products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchAllNewArrivalProducts ***");
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
        ...adminCustomerProductCard,
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
        ...adminCustomerProductCard,
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
          isDeleted: { $in: [false, "false", null] },
        },
        { isOwnDisabled: { $in: [false, "false", null] } },
        {
          $or: [
            { name: { $regex: req.body.value, $options: "i" } },
            { sku: { $regex: req.body.value, $options: "i" } },
            { tags: { $in: [req.body.value] } },
            { tags: { $elemMatch: { $regex: req.body.value, $options: "i" } } }
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
        ...adminCustomerProductFull,
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
      message: "Fetch all products successfully.",
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
          name: 1, slug: 1,
          image: 1, imageForCategoryProduct: 1, imageForHomePage: 1
        },
      },
    ]);

    if (!categoryData || categoryData.length === 0) {
      return res.status(200).json({
        metaData: customMetaData(page, pageLimit, 0),
        data: [],
        categoriesInfo: null,
        message: "Category not found.",
        success: true,
      });
    }

    const categoryIds = [];
    const categoryIdStrings = [];
    
    categoryData.forEach((cat) => {
      const catId = cat?._id;
      if (catId) {
        categoryIds.push(catId);
        categoryIdStrings.push(String(catId));
      }
      
      if (cat?.children && Array.isArray(cat.children)) {
        cat.children.forEach((subChild) => {
          const subChildId = subChild?._id;
          if (subChildId) {
            categoryIds.push(subChildId);
            categoryIdStrings.push(String(subChildId));
          }
          
          if (subChild?.children && Array.isArray(subChild.children)) {
            subChild.children.forEach((subSubChild) => {
              const subSubChildId = subSubChild?._id;
              if (subSubChildId) {
                categoryIds.push(subSubChildId);
                categoryIdStrings.push(String(subSubChildId));
              }
            });
          }
        });
      }
    });

    // Combine ObjectId and string IDs for matching (MongoDB $in handles both)
    const allCategoryIds = [...categoryIds, ...categoryIdStrings];

    // Convert all category IDs to strings for reliable comparison
    const allCategoryIdStrings = categoryIdStrings.filter(id => id && id !== "");
    
    // Build match condition that handles both flat categories[0] fields and array categories
    // Match products where any categories[0] through categories[9] matches our category IDs
    const categoryMatchConditions = [];
    
    // Add conditions for flat bracket fields (CSV import format)
    for (let i = 0; i < 10; i++) {
      categoryMatchConditions.push(
        { [`categories[${i}]`]: { $in: allCategoryIds } }
      );
    }
    
    // Also match if categories exists as array
    categoryMatchConditions.push({
      categories: { $in: allCategoryIds }
    });

    const [productsData, totalData, categoriesBySubCategories] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            $and: [
              {
                $or: categoryMatchConditions
              },
              {
                isDeleted: { $in: [false, "false", null] }
              },
              {
                isOwnDisabled: { $in: [false, "false", null] }
              }
            ]
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...adminCustomerProductCard,
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
      ProductModel.aggregate([
        {
          $match: {
            $and: [
              {
                $or: categoryMatchConditions
              },
              {
                isDeleted: { $in: [false, "false", null] }
              },
              {
                isOwnDisabled: { $in: [false, "false", null] }
              }
            ]
          }
        },
        { $count: "total" }
      ]),
      CategoryModel.find({ parentId: categoryData[0]?._id }, { name: 1, slug: 1, image: 1, imageForCategoryProduct: 1, imageForHomePage: 1 })
    ]);

    const totalCount = totalData[0]?.total || 0;

    if (!productsData || productsData.length === 0) {
      return res.status(200).json({
        metaData: customMetaData(page, pageLimit, 0),
        data: [],
        categoriesInfo: categoryData[0] ? {
          categories: categoryData[0],
          categoriesWiseSubcategories: categoriesBySubCategories || []
        } : null,
        message: "No product found in this category.",
        success: true,
      });
    }

    if (categoryData[0]) {
      delete categoryData[0].children;
    }
    
    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalCount),
      data: productsData || [],
      categoriesInfo: {
        categories: categoryData[0] || null,
        categoriesWiseSubcategories: categoriesBySubCategories || []
      },
      message: "Fetched all products by category successfully.",
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
        slug: req.params.brandSlug,
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

    // Handle both string and ObjectId brandId (CSV import stores as string)
    const brandIdStr = String(branchData._id);

    // Build match condition that works with string-typed boolean fields from CSV import
    const matchCondition = {
      $or: [
        { brandId: brandIdStr },
        { brandId: branchData._id }
      ],
      isDeleted: { $in: [false, "false", null] },
      isOwnDisabled: { $in: [false, "false", null] },
    };

    const [productData, countResult] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...adminCustomerProductCard,
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
      // Use aggregate for counting since countDocuments has issues with $or and mixed types
      ProductModel.aggregate([
        { $match: matchCondition },
        { $count: "total" }
      ]),
    ]);

    const totalData = countResult[0]?.total || 0;

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productData || [],
      message: productData?.length > 0
        ? "Fetched all products by brand successfully."
        : "No products found in this brand.",
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
            { isOwnDisabled: { $in: [false, "false", null] } },
            {
              isDeleted: { $in: [false, "false", null] },
            },
            {
              slug: { $eq: req.params.productSlug },
            },
          ],
        },
      },
      ...transformFlatFieldsToArrays,
      ...adminCustomerProductFull,
      {
        $project: {
          ...productProjection,
          description: 1,
          shortDescription: 1,
          guideline: 1,
          brand: 1,
          categories: 1,
          unit: 1,
          videoUrl: 1,
          chartTitle: 1,
          chartList: 1,
          tags: 1,
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
    const productSlug = req.params.productSlug;

    console.log(
      `[viewProductWithSimilarProduct] Fetching product with slug: ${productSlug}, similarLimit: ${LIMIT_OF_SIMILAR_PRODUCT}`
    );

    const productResults = await ProductModel.aggregate([
      {
        $match: {
          $and: [
            { isOwnDisabled: { $in: [false, "false", null] } },
            {
              isDeleted: { $in: [false, "false", null] },
            },
            {
              slug: { $eq: productSlug },
            },
          ],
        },
      },
      ...transformFlatFieldsToArrays,
      ...adminCustomerProductFull,
      {
        $project: {
          ...productProjection,
          brand: 1,
          categories: 1,
          description: 1,
          shortDescription: 1,
          guideline: 1,
          unit: 1,
          videoUrl: 1,
          chartTitle: 1,
          chartList: 1,
          tags: 1,
        },
      },
    ]);

    const [productData] = productResults;

    if (!productData) {
      console.log(
        `[viewProductWithSimilarProduct] Product not found for slug: ${productSlug}`
      );
      // Check if product exists but is deleted/disabled
      const existingProduct = await ProductModel.findOne(
        { slug: productSlug },
        { _id: 1, slug: 1, isDeleted: 1, isOwnDisabled: 1 }
      );

      if (existingProduct) {
        console.log(
          `[viewProductWithSimilarProduct] Product exists but unavailable`,
          {
            slug: existingProduct.slug,
            isDeleted: existingProduct.isDeleted,
            isOwnDisabled: existingProduct.isOwnDisabled,
          }
        );
      } else {
        console.log(
          `[viewProductWithSimilarProduct] No product found with slug: ${productSlug}`
        );
      }

      return res.status(404).json({
        data: null,
        message: existingProduct
          ? "Product is disabled or deleted."
          : "Product not found.",
        success: false,
        meta: existingProduct
          ? {
              isDeleted: existingProduct.isDeleted,
              isOwnDisabled: existingProduct.isOwnDisabled,
            }
          : null,
      });
    }

    console.log(
      `[viewProductWithSimilarProduct] Product found: ${
        productData._id
      } - ${productData.name || "N/A"}`
    );

    let similarProducts = [];
    if (productData?.categories && productData?.categories.length > 0) {
      similarProducts = await ProductModel.aggregate([
        {
          $match: {
            $and: [
              { isOwnDisabled: { $in: [false, "false", null] } },
              {
                isDeleted: { $in: [false, "false", null] },
              },
              {
                slug: { $ne: req.params.productSlug },
              },
              { categories: { $in: productData?.categories.map((i) => ObjectId(i?._id)) } },
            ],
          },
        },
        ...transformFlatFieldsToArrays,
        ...adminCustomerProductCard,
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
    // Handle both string and ObjectId productId
    let productIdMatch;
    try {
      productIdMatch = ObjectId(req.body.productId);
    } catch (err) {
      // If ObjectId conversion fails, try as string
      productIdMatch = req.body.productId;
    }

    const [productData] = await ProductModel.aggregate([
      {
        $match: {
          $and: [
            { isOwnDisabled: { $in: [false, "false", null] } },
            {
              isDeleted: { $in: [false, "false", null] },
            },
            {
              $or: [
                { _id: { $eq: productIdMatch } },
                { _id: { $eq: String(productIdMatch) } },
                { _id: { $eq: ObjectId(productIdMatch) } },
              ],
            },
          ],
        },
      },
      ...transformFlatFieldsToArrays,
      ...adminCustomerProductFull,
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
      // Ensure stock is a number for comparison
      const stock = typeof productData?.nonVariation?.stock === 'string' 
        ? parseFloat(productData.nonVariation.stock) || 0
        : productData?.nonVariation?.stock || 0;
      
      productObj = {
        ...productObj,
        stock: stock,
        sellingPrice: productData?.nonVariation?.sellingPrice,
      };
    } else {
      const variantData = productData?.variations.find(
        (item) => String(item?._id) === String(req.body.variationId)
      );
      
      // Ensure stock is a number for comparison
      const stock = variantData 
        ? (typeof variantData.stock === 'string' 
            ? parseFloat(variantData.stock) || 0
            : variantData.stock || 0)
        : 0;
      
      productObj = {
        ...productObj,
        stock: stock,
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
  fetchAllNewArrivalProducts,
  fetchAllFlashProducts,
  fetchAllFeatureProducts,
  searchProductsBySkuOrName,
  fetchAllProductByCategory,
  fetchAllProductByBrand,
  viewProduct,
  viewProductWithSimilarProduct,

  checkProductStock,
};
