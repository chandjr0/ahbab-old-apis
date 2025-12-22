const { customAlphabet } = require("nanoid");
const slug = require("slug");
const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const ProductModel = require("../../models/product/product");
const VariationModel = require("../../models/product/variation");
// const SectionModel = require("../../models/settings/section");
const CategoryModel = require("../../models/product/category");
const PurchaseModel = require("../../models/purchase/purchase");
const PurchaseProductModel = require("../../models/purchase/purchaseProducts");
const OrderModel = require("../../models/order/order");
const FlashDealModel = require("../../models/product/flashDealProduct");
const CustomerModel = require("../../models/user/customer");

const productQuery = require("../../helpers/productQuery");
const pagination = require("../../helpers/paginationQuery");
const uploadImage = require("../../utils/upload-img");
const deleteFile = require("../../utils/delete-file");
// const nestedCategories = require("../../utils/nestedCategory");
const customMetaData = require("../../helpers/customMetaData");
const { productSku, getPriceAfterDiscount } = require("../../helpers/shareFunc");

const customNanoId = customAlphabet("abcdefghijklmnopqrstuvwxyz123456789", 20);
const customBarCode = customAlphabet("0123456789", 17);

const productProjection = {
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
    sellQty: 0,
    totalSellPrice: 0,
  },
  variations: {
    purchaseQty: 0,
    totalPurchasePrice: 0,
    sellQty: 0,
    totalSellPrice: 0,
  },
};

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
      const galleryArray = req.body.galleryImage.forEach((img) =>
        uploadImage(img, "public/product/")
      );
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

      const productData = await ProductModel.create({ ...req.body, _id: PRODUCT_ID });

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
        stock: 0,
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
        req.body.nonVariation = nonVariationData;
      } else if (!req.body.isVariant) {
        const sellingPrice =
          getPriceAfterDiscount(
            req.body.nonVariation.regularPrice,
            req.body.nonVariation.discount.discountType,
            req.body.nonVariation.discount.amount
          ) || 0;

        const nonVariationObj = {
          ...nonVariationData,
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

    // delete from section
    // await SectionModel.updateMany(
    //   {},
    //   {
    //     $pull: {
    //       products: req.params.productId,
    //     },
    //   }
    // );

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
    const checkPurchaseProductData = await PurchaseProductModel.find(
      {
        variationId: req.params.variationId,
        isReceived: true,
      },
      { purchaseId: 1 }
    );
    const checkPurchaseIds = checkPurchaseProductData.map((i) => i?.purchaseId);
    const findInPurchase = await PurchaseModel.findOne({
      _id: { $in: checkPurchaseIds },
      supplierId: { $ne: null },
    });

    const findInOrder = await OrderModel.findOne({
      "products.variationId": req.params.variationId,
    });

    if (findInPurchase || findInOrder) {
      return res.status(400).json({
        data: null,
        message: "Product variation could not be deleted!",
        success: false,
      });
    }

    const variationData = await VariationModel.findOne({ _id: req.params.variationId });

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

    const selectedPurchaseProductData = await PurchaseProductModel.findOne({
      productId: variationData?.productId,
      variationId: req.params.variationId,
    });

    const anotherPurchaseProductData = await PurchaseProductModel.findOne({
      purchaseId: selectedPurchaseProductData?.purchaseId,
      _id: { $ne: selectedPurchaseProductData?._id },
    });

    if (anotherPurchaseProductData) {
      await PurchaseModel.findOneAndUpdate(
        {
          _id: selectedPurchaseProductData?.purchaseId,
        },
        {
          $inc: {
            totalBill: -selectedPurchaseProductData.quantity * selectedPurchaseProductData.price,
          },
        }
      );
      await PurchaseProductModel.deleteOne({
        _id: selectedPurchaseProductData?._id,
      });
    } else {
      await PurchaseProductModel.deleteOne({
        _id: selectedPurchaseProductData?._id,
      });
      await PurchaseModel.deleteOne({
        _id: selectedPurchaseProductData?.purchaseId,
      });
    }

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

// FETCH SINGLE PRODUCT
const fetchSingleProduct = async (req, res) => {
  try {
    let matchObj = {
      isDeleted: { $in: [false, "false", null] },
    };

    if (req.user.role === "visitor" || req.user.role === "customer") {
      matchObj = {
        isOwnDisabled: { $in: [false, "false", null] },
        isDeleted: { $in: [false, "false", null] },
      };
    }

    let onlyEnables = false;
    onlyEnables = req.user.role === "visitor" || req.user.role === "customer";

    let extractLookupArray = [
      ...productQuery.category(),
      ...productQuery.brand(),
      ...productQuery.sticker(),
      ...productQuery.variations(false, onlyEnables),
    ];

    if (req.user.role === "visitor" || req.user.role === "customer") {
      extractLookupArray = [
        ...productQuery.similarProducts(req.params.productSlug, matchObj),
        ...extractLookupArray,
      ];
    }

    const productData = await ProductModel.aggregate([
      {
        $match: matchObj,
      },
      {
        $match: {
          $expr: {
            $eq: ["$slug", req.params.productSlug],
          },
        },
      },
      ...extractLookupArray,
      {
        $project: {
          nonVariation: {
            purchaseQty: 0,
            totalPurchasePrice: 0,
            sellQty: 0,
            totalSellPrice: 0,
          },
          variations: {
            purchaseQty: 0,
            totalPurchasePrice: 0,
            sellQty: 0,
            totalSellPrice: 0,
          },
        },
      },
    ]);

    if (productData?.length <= 0) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch product!",
        success: false,
      });
    }

    return res.status(200).json({
      data: productData[0],
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

// DISABLE OR ENABLE PRODUCT VARIATION
const updateProductVariationStatus = async (req, res) => {
  try {
    /*
    console.log("enter..");
    const d = await VariationModel.updateMany(
      {},
      {
        $set: {
          isDisabled: false,
        },
      },
      { multi: true }
    );

    return res.json({ d });
*/

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

// FEATURE OWN PRODUCT
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
            isDeleted: { $in: [false, "false", null] },
            isOwnDisabled: { $in: [false, "false", null] },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...productQuery.sticker(),
        ...productQuery.variations(),
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
        isDeleted: { $in: [false, "false", null] },
        isOwnDisabled: { $in: [false, "false", null] },
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
    let matchObj = {};

    if (req.query.userType === "CUSTOMER") {
      matchObj = {
        isOwnDisabled: { $in: [false, "false", null] },
      };
    }

    const productData = await ProductModel.aggregate([
      {
        $match: { isDeleted: { $in: [false, "false", null] } },
      },
      {
        $match: matchObj,
      },
      {
        $lookup: {
          from: "brands",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$slug", req.params.brandSlug],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: "brandData",
        },
      },
      {
        $unwind: {
          path: "$brandData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: ["$brandId", "$brandData._id"],
              },
            ],
          },
        },
      },
      ...productQuery.category(),
      ...productQuery.brand(),
      ...productQuery.sticker(),
      ...productQuery.variations(),
      // ...productQuery.nonVariationPurchase(),
      {
        $project: productProjection,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      pagination(page, pageLimit),
    ]);

    if (productData?.length <= 0) {
      return res.status(400).json({
        data: null,
        message: "No product found in this brand.",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: productData[0]?.metadata[0] ? productData[0]?.metadata[0] : [],
      data: productData[0]?.data ? productData[0]?.data : [],
      message:
        productData[0]?.data?.length <= 0
          ? "No data found!"
          : "Fetched all products by brand successfully.",
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
        ...productQuery.fullVariations(),
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

// FETCH STOCK ALERT PRODUCTS
const fetchAllStockAlertProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const projection = {
      sku: 1,
      name: 1,
      slug: 1,
      galleryImage: 1,
      isVariant: 1,
      variations: 1,
      nonVariation: 1,
      stockAlert: 1,
      sellingPrice: 1,
      totalSell: 1,
    };

    const productsData = await ProductModel.aggregate([
      {
        $match: { isDeleted: { $in: [false, "false", null] } },
      },
      ...productQuery.variations(),
      {
        $match: {
          $expr: {
            $or: [
              {
                $and: [
                  {
                    $eq: ["$isVariant", false],
                  },
                  {
                    $lte: ["$nonVariation.stock", "$stockAlert"],
                  },
                ],
              },
              {
                $and: [
                  {
                    $eq: ["$isVariant", true],
                  },
                  {
                    $lte: [{ $min: "$variations.stock" }, "$stockAlert"],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $project: projection,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      pagination(page, pageLimit),
    ]);

    if (productsData?.length <= 0) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch stock alert products!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: productsData[0]?.metadata[0] ? productsData[0]?.metadata[0] : [],
      data: productsData[0]?.data ? productsData[0]?.data : [],
      message:
        productsData[0]?.data?.length <= 0
          ? "No data found!"
          : "Fetch stock alert products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchAllStockAlertProducts ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH STOCK ALERT PRODUCTS
const updateSingleProductStock = async (req, res) => {
  try {
    const productData = await ProductModel.findOne({ _id: req.params.productId });
    if (!productData) {
      return res.status(400).json({
        data: null,
        message: "Product could not found!",
        success: false,
      });
    }

    if (!req.body.isVariant) {
      productData.nonVariation.stock = req.body.nonVariationStock;
      productData.totalStock = req.body.nonVariationStock;
      await productData.save();
    } else if (req.body.variations.length > 0) {
      await Promise.all([
        req.body.variations.forEach(async (variant) => {
          await VariationModel.findOneAndUpdate(
            { _id: variant?.variantId },
            {
              $set: {
                stock: Number(variant?.stock),
              },
            }
          );
        }),
      ]);
      let totalStock = 0;
      req.body.variations.forEach((variant) => {
        totalStock += Number(variant?.stock);
      });
      productData.totalStock = totalStock;
      await productData.save();
    }

    if (!productData) {
      return res.status(400).json({
        data: null,
        message: "Failed to update product stock!",
        success: false,
      });
    }

    return res.status(200).json({
      data: productData,
      message: "Update product stock successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: updateSingleProductStock ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH TODAY FLASHDEAL PRODUCTS
const fetchTodayFlashDealProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            isOwnDisabled: { $in: [false, "false", null] },
            isFlashDeal: { $eq: true },
            isDeleted: { $in: [false, "false", null] },
          },
        },
        ...productQuery.sticker(),
        ...productQuery.variations(),
        {
          $project: productProjection,
        },
        {
          $sort: {
            createdAt: -1,
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
        isOwnDisabled: { $in: [false, "false", null] },
        isFlashDeal: { $eq: true },
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

// FETCH ALL PRODUCTS
const fetchAllProductsByAdmin = async (req, res) => {
  try {
    // console.log("body: ", req.body);

    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    let matchCondition = {
      isDeleted: { $in: [false, "false", null] },
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

    aggregationPipeline.push(...productQuery.category());
    aggregationPipeline.push(...productQuery.fullVariations());

    aggregationPipeline.push({
      $project: {
        description: 0,
        guideline: 0,
        brandId: 0,
        unit: 0,
        videoUrl: 0,
        chartTitle: 0,
        chartList: 0,
      },
    });

    aggregationPipeline.push({
      $skip: (page - 1) * pageLimit,
    });

    aggregationPipeline.push({
      $limit: pageLimit,
    });

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate(aggregationPipeline),
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

// FETCH ALL PRODUCTS
const fetchAllProducts = async (req, res) => {
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
            createdAt: -1,
          },
        },
        ...productQuery.category(),
        ...productQuery.fullVariations(),
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

// FETCH ALL CATEGORY PRODUCTS
const fetchAllProductByCategoryByAdmin = async (req, res) => {
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
            isDeleted: { $in: [false, "false", null] },
          },
        },
        ...productQuery.category(),
        ...productQuery.fullVariations(),
        {
          $sort: {
            createdAt: -1,
          },
        },
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
      ProductModel.countDocuments({
        categories: {
          $in: categoryIds,
        },
        isDeleted: { $in: [false, "false", null] },
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

// FETCH FEATURE PRODUCTS
const fetchFeatureProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            isFlashDeal: { $eq: false },
            isDeleted: { $in: [false, "false", null] },
            isFeatured: { $eq: true },
            isOwnDisabled: { $in: [false, "false", null] },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...productQuery.sticker(),
        ...productQuery.variations(),
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
        isFlashDeal: { $eq: false },
        isDeleted: { $in: [false, "false", null] },
        isFeatured: { $eq: true },
        isOwnDisabled: { $in: [false, "false", null] },
      }),
    ]);

    if (!productsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch products!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productsData,
      message:
        productsData[0]?.data?.length <= 0 ? "No data found!" : "Fetch products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchFeatureProducts ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH NEW-ARIVAL PRODUCTS
const fetchNewArrivalProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            isFlashDeal: { $eq: false },
            isDeleted: { $in: [false, "false", null] },
            isOwnDisabled: { $in: [false, "false", null] },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...productQuery.sticker(),
        ...productQuery.variations(),
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
        isFlashDeal: { $eq: false },
        isDeleted: { $in: [false, "false", null] },
        isOwnDisabled: { $in: [false, "false", null] },
      }),
    ]);

    if (!productsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch products!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productsData,
      message:
        productsData[0]?.data?.length <= 0 ? "No data found!" : "Fetch products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchNewArrivalProducts ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

// FETCH BEST DEAL PRODUCTS
const fetchBestDealProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const [productsData, totalData] = await Promise.all([
      ProductModel.aggregate([
        {
          $match: {
            isFlashDeal: { $eq: false },
            isDeleted: { $in: [false, "false", null] },
            isOwnDisabled: { $in: [false, "false", null] },
          },
        },
        ...productQuery.sticker(),
        ...productQuery.variations(),
        {
          $sort: {
            totalSell: -1,
          },
        },
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
        isFlashDeal: { $eq: false },
        isDeleted: { $in: [false, "false", null] },
        isOwnDisabled: { $in: [false, "false", null] },
      }),
    ]);

    if (!productsData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch products!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: productsData,
      message:
        productsData[0]?.data?.length <= 0 ? "No data found!" : "Fetch products successfully.",
      success: true,
    });
  } catch (err) {
    console.log("*** productController: fetchBestDealProducts ***");
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

    let matchObj = {
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

    if (req.query.userType === "CUSTOMER") {
      matchObj = {
        $and: [
          {
            isOwnDisabled: { $in: [false, "false", null] },
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
    }

    const conditionVariation =
      req.user.role === "admin" || req.user.role === "employee"
        ? productQuery.fullVariations()
        : productQuery.variations();

    const conditionalProjection =
      req.user.role === "admin" || req.user.role === "employee"
        ? {
            description: 0,
            guideline: 0,
            brandId: 0,
            unit: 0,
            videoUrl: 0,
            chartTitle: 0,
            chartList: 0,
          }
        : productProjection;

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
        ...productQuery.sticker(),
        ...productQuery.category(),
        ...conditionVariation,
        {
          $project: conditionalProjection,
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

// SECTION PRODUCT
const fetchSectionProducts = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;
    let matchObj = {};

    if (req.query.userType === "CUSTOMER") {
      matchObj = {
        isOwnDisabled: { $in: [false, "false", null] },
      };
    }

    const productData = await ProductModel.aggregate([
      {
        $match: { isDeleted: { $in: [false, "false", null] } },
      },
      {
        $match: matchObj,
      },
      {
        $lookup: {
          from: "sections",
          pipeline: [
            {
              $match: {
                slug: req.params.sectionSlug,
              },
            },
            {
              $project: {
                products: 1,
              },
            },
          ],
          as: "sections",
        },
      },
      {
        $unwind: {
          path: "$sections",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $expr: {
            $in: ["$_id", "$sections.products"],
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      ...productQuery.category(),
      ...productQuery.brand(),
      ...productQuery.sticker(),
      ...productQuery.variations(true),
      // ...productQuery.nonVariationPurchase(),
      {
        $project: productProjection,
      },
      pagination(page, pageLimit),
    ]);

    if (!productData) {
      return res.status(400).json({
        data: null,
        message: "Failed to fetch all products!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: productData[0]?.metadata[0] ? productData[0]?.metadata[0] : [],
      data: productData[0]?.data ? productData[0]?.data : [],
      message:
        productData[0]?.data?.length <= 0
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

// CREATE PRODUCT
const test = async (req, res) => {
  try {
    const lastOrder =
      (await ProductModel.findOne({}, { serialId: 1 })).sort({ createdAt: -1 })?.serialId || 0;

    let getSerialId = "0000001";
    getSerialId = `${lastOrder + 1}`;
    while (getSerialId.length < 7) {
      getSerialId = `0${getSerialId}`;
    }

    const customId = customAlphabet("ABCDEFGHIJKLMNPQRSTUVWXYZ", 10);
    const serialId = `${customId(4)}_${getSerialId}`;

    return res
      .status(201)
      .json({ lastOrder, serialId, message: "Product created successfully!", success: true });
  } catch (err) {
    console.log("*** productController: createProduct ***");
    console.log("ERROR:", err);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  // admin
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductVariation,
  updateOrderSuggestedProduct,
  disableOrApproveOwnProduct,
  updateProductVariationStatus,
  featureOwnProduct,
  fetchPosProducts,

  fetchAllStockAlertProducts,
  updateSingleProductStock,

  // share
  fetchAllProductsByAdmin,
  fetchAllProducts,
  fetchAllProductByCategoryByAdmin,
  fetchFeatureProducts,
  fetchNewArrivalProducts,
  fetchBestDealProducts,
  searchProductsBySkuOrName,
  fetchSingleProduct,
  fetchAllProductByCategory,
  fetchAllProductByBrand,
  fetchTodayFlashDealProducts,
  fetchSectionProducts,

  test,
};
