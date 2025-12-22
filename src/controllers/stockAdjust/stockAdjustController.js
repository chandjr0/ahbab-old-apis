// const { nanoid } = require("nanoid");
const { customAlphabet } = require("nanoid");

const customNanoId = customAlphabet("abcdefghijklmnopqrstuvwxyz", 20);

const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const StockAdjustModel = require("../../models/stockAdjust/stockAdjust");
const StockAdjustProductModel = require("../../models/stockAdjust/stockAdjustProducts");
const ProductModel = require("../../models/product/product");
const VariationModel = require("../../models/product/variation");

const uploadImage = require("../../utils/upload-img");
const customMetaData = require("../../helpers/customMetaData");

// CREATE PURCHASE
const createStockAdjust = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const MONGOOSE_ID = mongoose.Types.ObjectId();

      if (req.body.document) {
        req.body.document = uploadImage(req.body.document, "public/invoice/");
      }

      const checkAllProducts = await ProductModel.aggregate([
        {
          $match: {
            _id: { $in: req.body.products.map((i) => ObjectId(i?.productId)) },
            // isDeleted: false,
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
                  isDeleted: false,
                },
              },
              {
                $project: {
                  stock: 1,
                  purchaseQty: 1,
                  totalPurchasePrice: 1,
                },
              },
            ],
            as: "variationData",
          },
        },
        {
          $project: {
            name: 1,
            isVariant: 1,
            "nonVariation.stock": 1,
            "nonVariation.purchaseQty": 1,
            "nonVariation.totalPurchasePrice": 1,
            variationData: 1,
          },
        },
      ]);

      // return res.json({ checkAllProducts });

      let unitPrice = 0;
      const productBulkData = [];
      const variantBulkData = [];
      let errorMessage = "";

      const allProducts = req.body.products.map((product) => {
        const foundProd = checkAllProducts.find(
          (i) => String(i?._id) === String(product?.productId)
        );

        // product check
        if (!foundProd || foundProd?.isVariant !== product?.isVariant) {
          errorMessage = "There is some invalid products!";
        }

        if (!product?.isVariant) {
          // .... bulk ...
          let filterCond = { _id: ObjectId(product?.productId) };
          if (Number(product?.quantity) < 0) {
            filterCond = {
              ...filterCond,
              "nonVariation.stock": { $gte: Math.abs(Number(product?.quantity)) },
            };
          }

          unitPrice =
            foundProd.nonVariation.totalPurchasePrice / foundProd.nonVariation.purchaseQty;

          productBulkData.push({
            updateOne: {
              filter: filterCond,
              update: {
                $inc: {
                  "nonVariation.stock": -1 * Number(product?.quantity),
                  "nonVariation.purchaseQty": -1 * Number(product?.quantity),
                  "nonVariation.totalPurchasePrice":
                    -1 * Number(product?.quantity) * Number(unitPrice),
                  totalStock: -1 * Number(product?.quantity),
                },
              },
            },
          });

          // .... stock ...
          if (Number(foundProd?.nonVariation?.stock) < Number(product?.quantity)) {
            errorMessage = `${foundProd?.name} - has ${foundProd?.nonVariation?.stock} Qty. You want to reduce ${product?.quantity} Qty.`;
          }
        } else {
          const foundVariant = foundProd?.variationData.find(
            (i) => String(i?._id) === String(product?.variationId)
          );

          unitPrice = foundVariant.totalPurchasePrice / foundVariant.purchaseQty;

          // .... bulk ...
          productBulkData.push({
            updateOne: {
              filter: {
                _id: ObjectId(product?.productId),
              },
              update: {
                $inc: {
                  totalStock: -1 * Number(product?.quantity),
                },
              },
            },
          });

          let filterCond = { _id: ObjectId(product?.variationId) };
          if (Number(product?.quantity) < 0) {
            filterCond = {
              ...filterCond,
              stock: { $gte: Math.abs(Number(product?.quantity)) },
            };
          }

          variantBulkData.push({
            updateOne: {
              filter: filterCond,
              update: {
                $inc: {
                  stock: -1 * Number(product?.quantity),
                  purchaseQty: -1 * Number(product?.quantity),
                  totalPurchasePrice: -1 * Number(product?.quantity) * Number(unitPrice),
                },
              },
            },
          });

          // .... stock ...
          if (Number(foundVariant?.stock) < Number(product?.quantity)) {
            errorMessage = `${foundProd?.name}(${product?.variationName}) - has ${foundVariant?.stock} Qty. You want to reduce ${product?.quantity} Qty.`;
          }
        }

        return {
          ...product,
          price: unitPrice,
          variationId: product?.variationId === "" ? null : product?.variationId,
          stockAdjustId: MONGOOSE_ID,
        };
      });

      if (errorMessage !== "") {
        return res.status(409).json({
          data: null,
          success: false,
          message: errorMessage,
        });
      }

      const returnStockObj = {
        _id: MONGOOSE_ID,
        serialId: customNanoId(11),
        note: req.body.note,
        document: req.body.document,
        createdBy: req.user.role === "admin" ? "admin" : `${req.user.name}(${req.user.phone})`,
      };

      const [[returnStockData], productData, variantData] = await Promise.all([
        StockAdjustModel.insertMany([returnStockObj], { session }),
        ProductModel.bulkWrite(productBulkData, { session }),
        VariationModel.bulkWrite(variantBulkData, { session }),
        StockAdjustProductModel.insertMany(allProducts, { session }),
      ]);

      if (!returnStockData) {
        return res.status(400).json({
          data: null,
          success: false,
          message: "Failed to stock adjustment!",
        });
      }

      // console.log("productData: ", productData.nModified);
      // console.log("productBulkData: ", productBulkData.length);
      // console.log("variantData: ", variantData.nModified);
      // console.log("variantBulkData: ", variantBulkData.length);

      if (
        (productData.nModified || 0) !== productBulkData.length ||
        (variantData.nModified || 0) !== variantBulkData.length
      ) {
        throw new Error("There is some stock issue!");
      }

      await session.commitTransaction();

      return res.status(201).json({
        data: returnStockData,
        success: true,
        message: "Stock adjust successfully.",
      });
    });
  } catch (err) {
    console.log("*** stockAdjustController: createStockAdjust ***");
    console.log("ERROR:", err);
    await session.abortTransaction();
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  } finally {
    session.endSession();
  }
};

// FETCH ALL PURCHASE
const fetchAllStockAdjust = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {};

    if (req.body.startTime && req.body.endTime) {
      matchCondition = {
        createdAt: { $gte: new Date(req.body.startTime), $lte: new Date(req.body.endTime) },
      };
    }

    const [stockAdjustData, totalData] = await Promise.all([
      StockAdjustModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: "stock_adjust_products",
            foreignField: "stockAdjustId",
            localField: "_id",
            pipeline: [
              {
                $lookup: {
                  from: "products",
                  let: { prodId: "$productId" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$prodId"] } } },
                    {
                      $project: {
                        name: 1,
                        slug: 1,
                        galleryImage: 1,
                        sku: 1,
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
                $lookup: {
                  from: "variations",
                  let: { varId: "$variationId" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$varId"] } } },
                    {
                      $project: {
                        images: 1,
                      },
                    },
                  ],
                  as: "variation",
                },
              },
              {
                $unwind: {
                  path: "$variation",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: "products",
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      StockAdjustModel.countDocuments(matchCondition),
    ]);

    if (!stockAdjustData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch purchase",
      });
    }

    return res.status(201).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: stockAdjustData,
      message: "fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** stockAdjustController: fetchAllStockAdjust ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH SINGLE PURCHASE
const fetchSingleStockAdjust = async (req, res) => {
  try {
    const [stockAdjustData] = await StockAdjustModel.aggregate([
      {
        $match: {
          serialId: req.params.serialId,
        },
      },
      {
        $lookup: {
          from: "stock_adjust_products",
          foreignField: "stockAdjustId",
          localField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "products",
                let: { prodId: "$productId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$prodId"] } } },
                  {
                    $project: {
                      name: 1,
                      slug: 1,
                      galleryImage: 1,
                      sku: 1,
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
              $lookup: {
                from: "variations",
                let: { varId: "$variationId" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$varId"] } } },
                  {
                    $project: {
                      images: 1,
                    },
                  },
                ],
                as: "variation",
              },
            },
            {
              $unwind: {
                path: "$variation",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: "products",
        },
      },
    ]);

    if (!stockAdjustData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to fetch",
      });
    }

    return res.status(201).json({
      data: stockAdjustData,
      message: "fetch successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** stockAdjustController: fetchSingleStockAdjust ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createStockAdjust,
  fetchAllStockAdjust,
  fetchSingleStockAdjust,
};
