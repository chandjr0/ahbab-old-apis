const path = require("path");
const { customAlphabet } = require("nanoid");
const slug = require("slug");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const moment = require("moment");

const { ObjectId } = mongoose.Types;

const ProductModel = require("../../models/product/product");
const VariationModel = require("../../models/product/variation");
const CategoryModel = require("../../models/product/category");
const PurchaseModel = require("../../models/purchase/purchase");
const PurchaseProductModel = require("../../models/purchase/purchaseProducts");
// const OrderModel = require("../../models/order/order");
const FlashDealModel = require("../../models/product/flashDealProduct");
const CustomerModel = require("../../models/user/customer");

const productQuery = require("../../helpers/productQuery");
const uploadImage = require("../../utils/upload-img");
const deleteFile = require("../../utils/delete-file");
const customMetaData = require("../../helpers/customMetaData");
const { productSku, getPriceAfterDiscount } = require("../../helpers/shareFunc");
const { adminProductCard, adminProductFull } = require("../../helpers/productAssists");

const customNanoId = customAlphabet("abcdefghijklmnopqrstuvwxyz123456789", 20);
const customBarCode = customAlphabet("0123456789", 17);

// const productProjection = {};

//= ====================== CRUD START ==========================
// CREATE PRODUCT
const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      if (req.body.isVariant && req.body.variations.length <= 0) {
        res.status(400).json({
          data: null,
          message: "Add minimum one variation",
          success: false,
        });
      }

      const PRODUCT_ID = new mongoose.Types.ObjectId();

      if (req.body.isVariant) {
        const updateVariations = req.body.variations.map((variation) => {
          // upload variants image
          const imgArray = variation?.images.map((img) => uploadImage(img, "public/product/"));
          const sellingPrice =
            getPriceAfterDiscount(
              variation.regularPrice,
              variation.discount.discountType,
              variation.discount.amount
            ) || 0;

          return {
            productId: PRODUCT_ID,
            barCode: customBarCode(17),
            attributeOpts: variation?.attributeOpts,
            images: imgArray,
            regularPrice: variation?.regularPrice,
            sellingPrice,
            discount: variation?.discount,
          };
        });
        const variationData = await VariationModel.insertMany(updateVariations, { session });
        const variationIdx = variationData.map((data) => data._id);
        req.body.variations = variationIdx;
        delete req.body.nonVariation;
      } else if (!req.body.isVariant) {
        delete req.body.variations;
        const sellingPrice =
          getPriceAfterDiscount(
            req.body.nonVariation.regularPrice,
            req.body.nonVariation.discount.discountType,
            req.body.nonVariation.discount.amount
          ) || 0;

        const nonVariationObj = {
          sellingPrice,
          regularPrice: req.body.nonVariation.regularPrice,
          discount: req.body.nonVariation.discount,
        };

        req.body.nonVariation = nonVariationObj;
      }

      // upload gallary image
      const galleryArray = req.body.galleryImage.map((img) => uploadImage(img, "public/product/"));
      req.body.galleryImage = galleryArray;

      if (req.body.brandId === "") {
        delete req.body.brandId;
      }
      if (req.body.stickerId === "") {
        delete req.body.stickerId;
      }

      req.body.slug = `${slug(req.body.name)}-${customNanoId(6)}`;
      req.body.barCode = customBarCode(17);
      req.body.sku = await productSku();

      const [productData] = await ProductModel.create([{ ...req.body, _id: PRODUCT_ID }], {
        session,
      });

      if (!productData) {
        res.status(400).json({
          data: null,
          message: "Product could not be created.",
          success: false,
        });
      }

      await session.commitTransaction();
      return res.status(201).json({
        data: productData,
        message: "Product created successfully!",
        success: true,
      });
    });
  } catch (err) {
    await session.abortTransaction();
    console.log("*** productController: createProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  } finally {
    session.endSession();
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // if (req.body.isVariant && req.body.variations.length <= 0) {
      //   res.status(400).json({
      //     data: null,
      //     message: "Add minimum one variation",
      //     success: false,
      //   });
      // }

      const [productData] = await ProductModel.aggregate([
        {
          $match: {
            _id: ObjectId(req.params.productId),
          },
        },
        {
          $lookup: {
            from: "variations",
            localField: "variations",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  images: 1,
                },
              },
            ],
            as: "variationData",
          },
        },
      ]);

      if (!productData) {
        return res.status(400).json({
          data: null,
          message: "Product could not found!",
          success: false,
        });
      }

      // return res.json({  productData });

      // isUsed = isVariant not be changed!

      const nonVariationData = {
        regularPrice: 0,
        sellingPrice: 0,
        discount: {
          discountType: "FLAT",
          amount: 0,
        },
        flashPrice: 0,
      };

      const deleteObj = {
        $unset: {},
      };
      if (req.body.brandId === "") {
        delete req.body.brandId;
        deleteObj.$unset.brandId = 1;
      }
      if (req.body.stickerId === "") {
        delete req.body.stickerId;
        deleteObj.$unset.stickerId = 1;
      }

      let deletedImgList = [];
      if (req.body.isVariant) {
        const bulkVariationUpdate = productData?.variationData.map((variation) => {
          const variantData = req.body.oldVariations.find(
            (item) => String(item?._id) === String(variation?._id)
          );
          const imgArray = variantData?.images.map((img) => {
            const checkUrl = img.substring(0, 6);
            if (checkUrl !== "public") {
              return uploadImage(img, "public/product/");
            }
            return img;
          });

          // delete previous unused images
          variation?.images.forEach((img) => {
            if (!imgArray.includes(img)) {
              deletedImgList.push(img);
            }
          });

          const sellingPrice =
            getPriceAfterDiscount(
              variantData.regularPrice,
              variantData.discount.discountType,
              variantData.discount.amount
            ) || 0;

          return {
            updateOne: {
              filter: { _id: variantData?._id },
              update: {
                $set: {
                  sellingPrice,
                  regularPrice: variantData?.regularPrice,
                  discount: variantData?.discount,
                  images: imgArray,
                  flashPrice: 0,
                },
              },
            },
          };
        });

        const updateVariations = req.body.variations.map((variation) => {
          // upload variants image
          const imgArray = variation?.images.map((img) => uploadImage(img, "public/product/"));

          const sellingPrice =
            getPriceAfterDiscount(
              variation.regularPrice,
              variation.discount.discountType,
              variation.discount.amount
            ) || 0;

          return {
            productId: req.params.productId,
            barCode: customBarCode(17),
            attributeOpts: variation.attributeOpts,
            images: imgArray,
            sellingPrice,
            regularPrice: variation.regularPrice,
            discount: variation.discount,
          };
        });
        const [variationData] = await Promise.all([
          VariationModel.insertMany(updateVariations, { session }),
          VariationModel.bulkWrite(bulkVariationUpdate, { session }),
        ]);
        const newVariationIdx = variationData.map((data) => data._id);
        const oldVariationsIdx = productData?.variations.map((data) => data?._id);
        req.body.variations = [...oldVariationsIdx, ...newVariationIdx];
        req.body.nonVariation = { ...nonVariationData, stock: 0 };
      } else if (!req.body.isVariant) {
        const sellingPrice =
          getPriceAfterDiscount(
            req.body.nonVariation.regularPrice,
            req.body.nonVariation.discount.discountType,
            req.body.nonVariation.discount.amount
          ) || 0;

        const nonVariationObj = {
          ...JSON.parse(JSON.stringify(productData?.nonVariation)),
          regularPrice: req.body.nonVariation.regularPrice,
          discount: req.body.nonVariation.discount,
          sellingPrice,
        };

        // delete prev variations
        if (productData?.isVariant) {
          await VariationModel.deleteMany({ _id: { $in: productData?.variations } }, { session });
          const notDeleteImgs = productData.variationData.map((i) => i.images).flat(1);
          deletedImgList = [...deletedImgList, ...notDeleteImgs];
        }

        req.body.nonVariation = nonVariationObj;
        req.body.variations = [];
      }

      //  update gallary image
      const imgArray = req.body.galleryImage.map((img) => {
        const checkUrl = img.substring(0, 6);
        if (checkUrl !== "public") {
          return uploadImage(img, "public/product/");
        }
        return img;
      });
      req.body.galleryImage = imgArray;
      // delete previous unused images
      productData?.galleryImage.forEach((img) => {
        if (!imgArray.includes(img)) {
          deletedImgList.push(img);
        }
      });

      if (req.body.resellerDetails.commission === productData?.resellerDetails?.commission) {
        req.body.resellerDetails = {
          categoryId: productData?.resellerDetails?.categoryId,
          isCommissionOn: req.body?.resellerDetails?.isCommissionOn,
          commission: req.body?.resellerDetails?.commission,
        };
      } else {
        req.body.resellerDetails = {
          categoryId: null,
          isCommissionOn: req.body?.resellerDetails?.isCommissionOn,
          commission: req.body?.resellerDetails?.commission,
        };
      }

      const updateProductData = await ProductModel.findOneAndUpdate(
        { _id: req.params.productId },
        { $set: req.body, ...deleteObj },
        { new: true, session }
      );

      if (!updateProductData) {
        return res.status(400).json({
          data: null,
          message: "Product could not be Updated!",
          success: false,
        });
      }

      // remove from flashdeal
      if (productData?.isFlashDeal) {
        await FlashDealModel.updateOne(
          {},
          {
            $pull: {
              products: req.params.productId,
            },
          },
          {
            new: true,
            session,
          }
        );
      }

      deletedImgList.forEach((item) => {
        deleteFile(item);
      });

      return res.status(200).json({
        data: updateProductData,
        message: "Product updated successfully!",
        success: true,
      });
    });
  } catch (err) {
    await session.abortTransaction();
    console.log("*** productController: updateProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  } finally {
    session.endSession();
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const productData = await ProductModel.aggregate([
      {
        $match: {
          _id: ObjectId(req.params.productId),
        },
      },
      ...productQuery.variations(),
    ]);

    if (!productData[0]) {
      res.status(400).json({
        data: null,
        message: "Product could not found!",
        success: false,
      });
    }

    if (productData[0]?.totalStock > 0) {
      return res.status(409).json({
        data: null,
        message: "Product could not be deleted!",
        success: false,
      });
    }

    if (productData[0]?.isUsed) {
      await ProductModel.findOneAndUpdate(
        { _id: req.params.productId },
        {
          $set: {
            isDeleted: true,
          },
        }
      );
    } else {
      const allImg = [];
      const variationIds = [];

      productData[0].galleryImage.forEach((i) => {
        allImg.push(i);
      });

      productData[0].variations.forEach((i) => {
        variationIds.push(i?._id);
        i.images.forEach((j) => {
          allImg.push(j);
        });
      });

      allImg.forEach((img) => {
        deleteFile(img);
      });
      await ProductModel.findOneAndDelete({ _id: req.params.productId });
      await VariationModel.deleteMany({
        _id: { $in: variationIds },
      });

      // delete old purchase data
      const purchaseProductData = await PurchaseProductModel.find(
        {
          productId: req.params.productId,
        },
        { purchaseId: 1 }
      );
      const purchaseIds = purchaseProductData.map((i) => i?.purchaseId);
      await PurchaseModel.deleteMany({
        _id: { $in: purchaseIds },
      });
      await PurchaseProductModel.deleteMany({ productId: req.params.productId });
    }

    // delete from flashdeal
    await Promise.all([
      await ProductModel.findOneAndUpdate(
        { _id: req.params.productId },
        {
          $set: {
            "nonVariation.flashPrice": 0,
            isFlashDeal: false,
          },
        },
        {
          new: true,
        }
      ),
      await VariationModel.updateMany(
        {
          productId: { $in: req.params.productId },
        },
        {
          $set: {
            flashPrice: 0,
          },
        },
        {
          new: true,
        }
      ),
      await FlashDealModel.findOneAndUpdate(
        {},
        {
          $pull: {
            products: req.params.productId,
          },
        },
        {
          new: true,
        }
      ),
    ]);

    // remove from customer wishlist
    await CustomerModel.updateMany(
      {},
      { $pull: { wishList: req.params.productId } },
      { new: true }
    );

    return res.status(200).json({
      data: productData[0],
      message: "Product deleted successfully!",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: updateProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// DELETE PRODUCT VARIATION
const deleteProductVariation = async (req, res) => {
  try {
    const variationData = await VariationModel.findOne({ _id: req.params.variationId });

    if (!variationData) {
      return res.status(400).json({
        data: null,
        message: "Product variation not found!",
        success: false,
      });
    }

    if (variationData?.stock > 0) {
      return res.status(409).json({
        data: null,
        message: "Product variation could not be deleted!",
        success: false,
      });
    }

    if (variationData?.isUsed) {
      return res.status(409).json({
        data: null,
        message: "Product variation could not be deleted!",
        success: false,
      });
    }

    variationData?.images.forEach((img) => {
      deleteFile(img);
    });

    await ProductModel.findOneAndUpdate(
      { _id: variationData?.productId },
      {
        $pull: {
          variations: req.params.variationId,
        },
      },
      { new: true }
    );
    await VariationModel.findOneAndDelete({ _id: req.params.variationId });

    return res.status(200).json({
      data: variationData,
      message: "Product variation deleted successfully!",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: deleteProductVariation ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// DISABLE OR ENABLE PRODUCT VARIATION
const updateProductVariationStatus = async (req, res) => {
  try {
    const VariationData = await VariationModel.findOneAndUpdate(
      {
        _id: { $in: req.body.variantId },
      },
      {
        $set: {
          isDisabled: req.body.isDisabled,
        },
      },
      {
        new: true,
      }
    );

    if (!VariationData) {
      return res.status(400).json({
        data: null,
        message: "Failed to update status",
        success: false,
      });
    }

    return res.status(200).json({
      data: VariationData,
      message: `${req.body.isDisabled ? "disabled" : "enabled"} successfully.`,
      success: true,
    });
  } catch (err) {
    console.log("*** productController: disableOrApproveOwnProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// DISABLE OR ENABLE OWN PRODUCT
const disableOrApproveOwnProduct = async (req, res) => {
  try {
    await ProductModel.updateMany(
      {
        _id: { $in: req.body.products },
      },
      {
        $set: {
          isOwnDisabled: req.body.isOwnDisabled,
        },
      }
    );

    const productData = await ProductModel.find({
      _id: { $in: req.body.products },
    });

    return res.status(200).json({
      data: productData,
      message: `${req.body.isOwnDisabled ? "disabled" : "enabled"} successfully.`,
      success: true,
    });
  } catch (err) {
    console.log("*** productController: disableOrApproveOwnProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ADD/DEL ORDER SUGGESTED PRODUCT
const updateOrderSuggestedProduct = async (req, res) => {
  try {
    await ProductModel.updateMany(
      {
        _id: { $in: req.body.products },
      },
      {
        $set: {
          isPosSuggest: req.body.isPosSuggest,
        },
      }
    );

    const productData = await ProductModel.find({
      _id: { $in: req.body.products },
    });

    if (!productData) {
      return res.status(400).json({
        data: null,
        success: false,
        message: "Failed to update top pos product!",
      });
    }

    return res.status(200).json({
      data: productData,
      success: true,
      message: "Update Top Pos Product successfully.",
    });
  } catch (err) {
    console.log("*** productController: updateOrderSuggestedProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FEATURE ON/OFF OWN PRODUCT
const featureOwnProduct = async (req, res) => {
  try {
    await ProductModel.updateMany(
      {
        _id: { $in: req.body.products },
      },
      {
        $set: {
          isFeatured: req.body.isFeatured,
        },
      }
    );

    const productData = await ProductModel.find({
      _id: { $in: req.body.products },
    });

    return res.status(200).json({
      data: productData,
      message: `${req.body.isFeatured ? "featured" : "feature remove"} successfully.`,
      success: true,
    });
  } catch (err) {
    console.log("*** productController: featureOwnProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// RESELLER ON/OFF OWN PRODUCT
const resellerProductStatusUpdate = async (req, res) => {
  try {
    await ProductModel.updateMany(
      {
        _id: { $in: req.body.products },
      },
      {
        $set: {
          isReseller: req.body.isReseller,
        },
      }
    );

    const productData = await ProductModel.find({
      _id: { $in: req.body.products },
    });

    return res.status(200).json({
      data: productData,
      message: `reseller product ${req.body.isReseller ? "on" : "off"} successfully.`,
      success: true,
    });
  } catch (err) {
    console.log("*** productController: featureOwnProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

//= ====================== CRUD END ==========================

// FETCH ALL PRODUCTS
const fetchAllProductsByAdmin = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {
      isDeleted: { $in: [false, "false", null] },
    };

    if (req.body.prodType === "FEATURED") {
      matchCondition = {
        ...matchCondition,
        isFeatured: { $in: [true, "true", "True", "TRUE", 1] },
      };
    } else if (req.body.prodType === "NON_FEATURED") {
      matchCondition = {
        ...matchCondition,
        isFeatured: { $in: [false, "false", null] },
      };
    } else if (req.body.prodType === "PUBLISH") {
      matchCondition = {
        ...matchCondition,
        isOwnDisabled: { $in: [false, "false", null] },
      };
    } else if (req.body.prodType === "UNPUBLISH") {
      matchCondition = {
        ...matchCondition,
        isOwnDisabled: { $in: [true, "true", "True", "TRUE", 1] },
      };
    } else if (req.body.prodType === "TOP_POS") {
      matchCondition = {
        ...matchCondition,
        isPosSuggest: { $in: [true, "true", "True", "TRUE", 1] },
      };
    } else if (req.body.prodType === "FLASH") {
      matchCondition = {
        ...matchCondition,
        isFlashDeal: { $in: [true, "true", "True", "TRUE", 1] },
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
        ...adminProductCard,
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
    console.log("*** productController: fetchAllProductsByAdmin ***");
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
        ...adminProductCard,
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

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: { isDeleted: { $in: [false, "false", null] } },
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
            nonVariation: 1,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ProductModel.countDocuments({
        isDeleted: { $in: [false, "false", null] },
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

// SEARCH PRODUCTS BY SKU OR NAME
const searchProductsBySkuOrNameForReseller = async (req, res) => {
  try {
    req.body.value = req.body.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchObj = {
      $and: [
        {
          isDeleted: { $in: [false, "false", null] },
        },
        {
          isReseller: { $in: [true, "true", "True", "TRUE", 1] },
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
        ...adminProductCard,
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
const fetchPosProductsForReseller = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            isDeleted: { $in: [false, "false", null] },
            isReseller: { $in: [true, "true", "True", "TRUE", 1] },
          },
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
            nonVariation: 1,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ProductModel.countDocuments({
        isDeleted: { $in: [false, "false", null] },
        isReseller: { $in: [true, "true", "True", "TRUE", 1] },
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

// FETCH SINGLE PRODUCT
const viewProduct = async (req, res) => {
  try {
    const [productData] = await ProductModel.aggregate([
      {
        $match: {
          $and: [
            {
              isDeleted: { $in: [false, "false", null] },
            },
            {
              slug: { $eq: req.params.productSlug },
            },
          ],
        },
      },
      ...adminProductFull,
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

const downloadProductCSV = async (req, res) => {
  try {
    const productData = await ProductModel.aggregate([
      {
        $match: { isDeleted: { $in: [false, "false", null] } },
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

    if (!productData) {
      return res.status(500).json({
        data: null,
        success: false,
        message: "There is some issue. Retry again",
      });
    }
    const data = [
      [
        "SKU",
        "Title",
        "Variant",
        "Stock",
        "Purchase Qty",
        "Total Purchase",
        "Unit Purchase",
        "Sell Qty",
        "Total Sell",
        "Unit Sell",
        "Unit Profit",
        "Total Profit",
      ],
    ];

    productData.forEach((prod) => {
      if (prod.isVariant) {
        prod.variations.forEach((variant, idx) => {
          const unitPurchase =
            Number(variant.purchaseQty) <= 0
              ? 0
              : Number(variant.totalPurchasePrice) / Number(variant.purchaseQty);
          const unitSell =
            Number(variant.sellQty) <= 0
              ? 0
              : Number(variant.totalSellPrice) / Number(variant.sellQty);
          const unitProfit = Number(variant.sellQty) <= 0 ? 0 : unitSell - unitPurchase;
          const totalProfit =
            Number(variant?.totalSellPrice) - unitPurchase * (Number(variant.sellQty) || 0);

          const tPurchaseQty = Number(variant.purchaseQty) || 0;
          const tUnitPurchase = Number(unitPurchase.toFixed(2)) || 0;
          const tTotalPurchasePrice = Number(variant.totalPurchasePrice) || 0;
          const tSellQty = Number(variant.sellQty) || 0;
          const tTotalSellPrice = Number(variant.totalSellPrice) || 0;
          const tUnitSell = Number(unitSell.toFixed(2)) || 0;
          const tUnitProfit = Number(unitProfit.toFixed(2)) || 0;
          const tTotalProfit = Number(totalProfit.toFixed(2)) || 0;

          let productArr = [];
          if (idx === 0) {
            productArr = [prod?.sku, prod?.name];
          } else {
            productArr = ["", ""];
          }
          productArr.push(variant.attributeOpts.map((item) => item?.name).join("-"));
          productArr.push(variant?.stock);
          productArr.push(tPurchaseQty);
          productArr.push(tTotalPurchasePrice);
          productArr.push(tUnitPurchase);
          productArr.push(tSellQty);
          productArr.push(tTotalSellPrice);
          productArr.push(tUnitSell);
          productArr.push(tUnitProfit);
          productArr.push(tTotalProfit);
          data.push(productArr);
        });
      } else {
        const unitPurchase =
          Number(prod.nonVariation.purchaseQty) <= 0
            ? 0
            : Number(prod.nonVariation.totalPurchasePrice) / Number(prod.nonVariation.purchaseQty);
        const unitSell =
          Number(prod.nonVariation.sellQty) <= 0
            ? 0
            : Number(prod.nonVariation.totalSellPrice) / Number(prod.nonVariation.sellQty);
        const unitProfit = Number(prod.nonVariation.sellQty) <= 0 ? 0 : unitSell - unitPurchase;
        const totalProfit =
          Number(prod.nonVariation?.totalSellPrice) -
          unitPurchase * (Number(prod.nonVariation.sellQty) || 0);

        const tPurchaseQty = Number(prod.nonVariation.purchaseQty) || 0;
        const tUnitPurchase = Number(unitPurchase.toFixed(2)) || 0;
        const tTotalPurchasePrice = Number(prod.nonVariation.totalPurchasePrice) || 0;
        const tSellQty = Number(prod.nonVariation.sellQty) || 0;
        const tTotalSellPrice = Number(prod.nonVariation.totalSellPrice) || 0;
        const tUnitSell = Number(unitSell.toFixed(2)) || 0;
        const tUnitProfit = Number(unitProfit.toFixed(2)) || 0;
        const tTotalProfit = Number(totalProfit.toFixed(2)) || 0;

        const productArr = [prod?.sku, prod?.name];
        productArr.push("-");
        productArr.push(prod?.nonVariation?.stock || 0);
        productArr.push(tPurchaseQty);
        productArr.push(tTotalPurchasePrice);
        productArr.push(tUnitPurchase);
        productArr.push(tSellQty);
        productArr.push(tTotalSellPrice);
        productArr.push(tUnitSell);
        productArr.push(tUnitProfit);
        productArr.push(tTotalProfit);
        data.push(productArr);
      }
    });

    const { utils, writeFile } = XLSX;
    const fileName = `${moment().format("L").replace(/\//g, "-")}-list.xlsx`;
    const filePath = path.join(process.cwd(), "public", "download-excel", fileName);
    const excelFilePath = `/public/download-excel/${fileName}`;
    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet(data);
    utils.book_append_sheet(workbook, worksheet, "Sheet1");
    writeFile(workbook, filePath);

    return res
      .status(201)
      .json({ data: excelFilePath, message: "Product created successfully!", success: true });
  } catch (err) {
    console.log("*** productController: downloadProductCSV ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// ================

// CREATE PRODUCT
const test = async (req, res) => {
  try {
    return res.status(201).json({ message: "Product created successfully!", success: true });
  } catch (err) {
    console.log("*** productController: downloadProductCSV ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  // CRUDE
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductVariation,
  updateOrderSuggestedProduct,
  disableOrApproveOwnProduct,
  updateProductVariationStatus,
  featureOwnProduct,
  resellerProductStatusUpdate,

  // LIST

  fetchAllProductsByAdmin,
  searchProductsBySkuOrName,
  fetchPosProducts,
  searchProductsBySkuOrNameForReseller,
  fetchPosProductsForReseller,
  viewProduct,
  downloadProductCSV,

  test,
};
