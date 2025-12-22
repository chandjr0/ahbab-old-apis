const { customAlphabet } = require("nanoid");
const slug = require("slug");
const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;
const customNanoId = customAlphabet("abcdefghijklmnopqrstuvwxyz", 20);

const ComboModel = require("../../models/comboProduct/combo");
const ComboProductModel = require("../../models/comboProduct/comboProduct");

const ProductModel = require("../../models/product/product");

const uploadImage = require("../../utils/upload-img");
const deleteFile = require("../../utils/delete-file");
const customMetaData = require("../../helpers/customMetaData");
const { comboSku } = require("../../helpers/shareFunc");
const { adminComboFull } = require("../../helpers/comboProduct");

const comboProjection = {
  name: 1,
  slug: 1,
  sku: 1,
  galleryImage: 1,
  regularPrice: 1,
  sellingPrice: 1,
  isReseller: 1,
  isFeatured: 1,
  isPosSuggest: 1,
  isOwnDisabled: 1,
  createdAt: 1,
  comboProduct: {
    _id: 1,
    name: 1,
    slug: 1,
    sku: 1,
    galleryImage: 1,
    isVariant: 1,
    price: 1,
    sellingPrice: 1,
  },
};

const createCombo = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const COMBO_ID = new mongoose.Types.ObjectId();

      const checkProductData = await ProductModel.find(
        {
          _id: { $in: req.body.comboProducts.map((item) => ObjectId(item?.productId)) },
          isDeleted: false,
        },
        {
          _id: 1,
          sku: 1,
        }
      );

      if (checkProductData.length !== req.body.comboProducts.length) {
        return res.status(409).json({
          data: null,
          message: "There is some invalid products!",
          success: false,
        });
      }

      if (
        req.body.sellingPrice !== req.body.comboProducts.reduce((prev, cur) => prev + cur.price, 0)
      ) {
        return res.status(409).json({
          data: null,
          message: "Incorrect selling price calculation!",
          success: false,
        });
      }

      const sku = await comboSku();

      const comboObj = {
        _id: COMBO_ID,
        name: req.body.name,
        regularPrice: req.body.regularPrice,
        sellingPrice: req.body.sellingPrice,
        products: checkProductData.map((item) => ({
          productId: item?._id,
          sku: item?.sku,
        })),
        slug: `${slug(req.body.name)}-${customNanoId(6)}`,
        sku,
        galleryImage: req.body.galleryImage.map((img) => uploadImage(img, "public/product/")),
        description: req.body.description,
        guideline: req.body.guideline,
        videoUrl: req.body.videoUrl,
        isReseller: req.body.isReseller,
        resellerDetails: req.body.resellerDetails,
        isFeatured: req.body.isFeatured,
        isPosSuggest: req.body.isPosSuggest,
        isOwnDisabled: req.body.isOwnDisabled,
      };

      const comboProductArr = req.body.comboProducts.map((product) => ({
        comboId: COMBO_ID,
        productId: product?.productId,
        price: product?.price,
      }));

      const [[comboData]] = await Promise.all([
        ComboModel.create([comboObj], { session }),
        ComboProductModel.insertMany(comboProductArr, { session }),
      ]);

      if (!comboData) {
        return res.status(400).json({
          data: null,
          message: "Combo could not be created.",
          success: false,
        });
      }

      await session.commitTransaction();
      return res.status(201).json({
        data: comboData,
        message: "Combo created successfully!",
        success: true,
      });
    });
  } catch (e) {
    await session.abortTransaction();
    console.log("*** productController: createProduct ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  } finally {
    session.endSession();
  }
};

const updateCombo = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const checkComboData = await ComboModel.findOne({ _id: req.params.comboId });

      if (!checkComboData) {
        return res.status(400).json({
          data: null,
          message: "Combo not found!",
          success: false,
        });
      }

      if (
        req.body.sellingPrice !== req.body.comboProducts.reduce((prev, cur) => prev + cur.price, 0)
      ) {
        return res.status(409).json({
          data: null,
          message: "Incorrect selling price calculation!",
          success: false,
        });
      }

      //  update gallary image
      const imgArray = req.body.galleryImage.map((img) => {
        const checkUrl = img.substring(0, 6);
        if (checkUrl !== "public") {
          return uploadImage(img, "public/product/");
        }
        return img;
      });

      // delete previous unused images
      const deletedImgList = [];
      checkComboData?.galleryImage.forEach((img) => {
        if (!imgArray.includes(img)) {
          deletedImgList.push(img);
        }
      });

      const comboObj = {
        name: req.body.name,
        regularPrice: req.body.regularPrice,
        sellingPrice: req.body.sellingPrice,
        galleryImage: imgArray,
        description: req.body.description,
        guideline: req.body.guideline,
        videoUrl: req.body.videoUrl,
        isReseller: req.body.isReseller,
        resellerDetails: req.body.resellerDetails,
        isFeatured: req.body.isFeatured,
        isPosSuggest: req.body.isPosSuggest,
        isOwnDisabled: req.body.isOwnDisabled,
      };

      const comboProductBulk = req.body.comboProducts.map((comboProduct) => ({
        updateOne: {
          filter: {
            comboId: ObjectId(req.params.comboId),
            productId: ObjectId(checkComboData?.productId),
          },
          update: {
            $set: {
              price: comboProduct?.price,
            },
          },
        },
      }));

      const [comboData] = await Promise.all([
        ComboModel.findOneAndUpdate(
          {
            _id: req.params.comboId,
          },
          {
            $set: comboObj,
          },
          {
            new: true,
            session,
          }
        ),
        ComboProductModel.bulkWrite(comboProductBulk, { session }),
      ]);

      if (!comboData) {
        return res.status(400).json({
          data: null,
          message: "Combo could not be created.",
          success: false,
        });
      }

      await session.commitTransaction();

      deletedImgList.forEach((item) => {
        deleteFile(item);
      });

      return res.status(200).json({
        data: comboData,
        message: "Combo updated successfully!",
        success: true,
      });
    });
  } catch (e) {
    await session.abortTransaction();
    console.log("*** productController: createProduct ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  } finally {
    session.endSession();
  }
};

const deleteCombo = async (req, res) => {
  try {
    const checkComboData = await ComboModel.findOne({ _id: req.params.comboId });

    if (!checkComboData) {
      return res.status(400).json({
        data: null,
        message: "Combo not found!",
        success: false,
      });
    }

    const comboData = await ComboModel.findOneAndUpdate(
      {
        _id: req.params.comboId,
      },
      {
        $set: {
          isDeleted: true,
        },
      },
      {
        new: true,
      }
    );

    if (!comboData) {
      return res.status(400).json({
        data: null,
        message: "Combo could not be deleted!",
        success: false,
      });
    }

    return res.status(200).json({
      data: comboData,
      message: "Combo deleted successfully!",
      success: true,
    });
  } catch (e) {
    console.log("*** productController: createProduct ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const listOFCombo = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        isDeleted: { $in: [false, "false", null] },
      },
    ];

    if (req.body.value !== "") {
      matchCondition.push({
        $or: [
          { name: { $regex: req.body.value, $options: "i" } },
          { sku: { $regex: req.body.value, $options: "i" } },
          { "products.sku": { $regex: req.body.value, $options: "i" } },
        ],
      });
    }

    if (req.body.comboType === "FEATURED") {
      matchCondition.push({
        isFeatured: true,
      });
    } else if (req.body.comboType === "NON_FEATURED") {
      matchCondition.push({
        isFeatured: false,
      });
    } else if (req.body.comboType === "PUBLISH") {
      matchCondition.push({
        isOwnDisabled: false,
      });
    } else if (req.body.comboType === "UNPUBLISH") {
      matchCondition.push({
        isOwnDisabled: true,
      });
    } else if (req.body.comboType === "TOP_POS") {
      matchCondition.push({
        isPosSuggest: true,
      });
    }

    const aggregationPipeline = [
      {
        $match: {
          $and: matchCondition,
        },
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

    const [comboData, totalData] = await Promise.all([
      ComboModel.aggregate([
        ...aggregationPipeline,
        {
          $lookup: {
            from: "combo_products",
            localField: "_id",
            foreignField: "comboId",
            pipeline: [
              {
                $lookup: {
                  from: "products",
                  localField: "productId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        name: 1,
                        slug: 1,
                        sku: 1,
                        galleryImage: 1,
                        isVariant: 1,
                      },
                    },
                  ],
                  as: "productData",
                },
              },
              {
                $unwind: {
                  path: "$productData",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $replaceRoot: {
                  newRoot: { $mergeObjects: ["$productData", "$$ROOT"] },
                },
              },
            ],
            as: "comboProduct",
          },
        },
        {
          $project: comboProjection,
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ComboModel.countDocuments({ $and: matchCondition }),
    ]);

    if (!comboData) {
      return res.status(400).json({
        data: null,
        message: "Combo not found!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: comboData,
      message: "Combo fetch successfully!",
      success: true,
    });
  } catch (e) {
    console.log("*** productController: listOFCombo ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const posListOFCombo = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        isDeleted: { $in: [false, "false", null] },
      },
    ];

    if (req.body.value !== "") {
      matchCondition.push({
        $or: [
          { name: { $regex: req.body.value, $options: "i" } },
          { sku: { $regex: req.body.value, $options: "i" } },
          { "products.sku": { $regex: req.body.value, $options: "i" } },
        ],
      });
    }

    const [comboData, totalData] = await Promise.all([
      ComboModel.aggregate([
        {
          $match: {
            $and: matchCondition,
          },
        },
        {
          $lookup: {
            from: "combo_products",
            localField: "_id",
            foreignField: "comboId",
            pipeline: [
              {
                $lookup: {
                  from: "products",
                  localField: "productId",
                  foreignField: "_id",
                  pipeline: [
                    ...adminComboFull,
                    {
                      $project: {
                        name: 1,
                        slug: 1,
                        sku: 1,
                        galleryImage: 1,
                        isVariant: 1,
                        variations: 1,
                        "nonVariation.sellingPrice": 1,
                        "nonVariation.stock": 1,
                        // sellingPrice: 1,
                        productId: 1,
                      },
                    },
                  ],
                  as: "productData",
                },
              },
              {
                $unwind: {
                  path: "$productData",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $replaceRoot: {
                  newRoot: { $mergeObjects: ["$productData", "$$ROOT"] },
                },
              },
            ],
            as: "comboProduct",
          },
        },
        {
          $project: {
            ...comboProjection,
            // description: 1,
            // guideline: 1,
            // videoUrl: 1,
            comboProduct: {
              ...comboProjection.comboProduct,
              variations: 1,
              productId: 1,
              "nonVariation.sellingPrice": 1,
              "nonVariation.stock": 1,
            },
          },
        },
        // {
        //   $project: {
        //     products: 0,
        //     "comboProduct.productData": 0,
        //     "comboProduct.createdAt": 0,
        //     "comboProduct.updatedAt": 0,
        //     "comboProduct.__v": 0,
        //   },
        // },
        {
          $sort: {
            isPosSuggest: -1,
          },
        },
        {
          $skip: (page - 1) * pageLimit,
        },
        {
          $limit: pageLimit,
        },
      ]),
      ComboModel.countDocuments({ $and: matchCondition }),
    ]);

    if (!comboData) {
      return res.status(400).json({
        data: null,
        message: "Combo not found!",
        success: false,
      });
    }

    return res.status(200).json({
      metaData: customMetaData(page, pageLimit, totalData),
      data: comboData,
      message: "Combo fetch successfully!",
      success: true,
    });
  } catch (e) {
    console.log("*** productController: posListOFCombo ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const viewCombo = async (req, res) => {
  try {
    const [comboData] = await ComboModel.aggregate([
      {
        $match: {
          slug: req.params.comboSlug,
        },
      },
      {
        $lookup: {
          from: "combo_products",
          localField: "_id",
          foreignField: "comboId",
          pipeline: [
            {
              $lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                pipeline: [
                  ...adminComboFull,
                  {
                    $project: {
                      name: 1,
                      slug: 1,
                      sku: 1,
                      galleryImage: 1,
                      isVariant: 1,
                      variations: 1,
                      "nonVariation.sellingPrice": 1,
                      productId: 1,
                    },
                  },
                ],
                as: "productData",
              },
            },
            {
              $unwind: {
                path: "$productData",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $replaceRoot: {
                newRoot: { $mergeObjects: ["$productData", "$$ROOT"] },
              },
            },
          ],
          as: "comboProduct",
        },
      },
      // {
      //   $project: {
      //     ...comboProjection,
      //     description: 1,
      //     guideline: 1,
      //     videoUrl: 1,
      //     comboProduct: {
      //       ...comboProjection.comboProduct,
      //       variations: 1,
      //       productId: 1,
      //       "nonVariation.sellingPrice": 1,
      //     },
      //   },
      // },
      {
        $project: {
          products: 0,
          "comboProduct.productData": 0,
          "comboProduct.createdAt": 0,
          "comboProduct.updatedAt": 0,
          "comboProduct.__v": 0,
        },
      },
    ]);

    if (!comboData) {
      return res.status(400).json({
        data: null,
        message: "Combo not found!",
        success: false,
      });
    }

    return res.status(200).json({
      data: comboData,
      message: "Combo fetch successfully!",
      success: true,
    });
  } catch (e) {
    console.log("*** productController: createProduct ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const featuredCombo = async (req, res) => {
  try {
    const comboData = await ComboModel.findOneAndUpdate(
      {
        _id: req.params.comboId,
      },
      {
        $set: {
          isFeatured: req.body.isFeatured,
        },
      },
      {
        new: true,
      }
    );

    if (!comboData) {
      return res.status(400).json({
        data: null,
        message: "Combo could not be update!",
        success: false,
      });
    }

    return res.status(200).json({
      data: comboData,
      message: "Combo status updated successfully!",
      success: true,
    });
  } catch (e) {
    console.log("*** productController: featuredCombo ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const posSuggestedCombo = async (req, res) => {
  try {
    const comboData = await ComboModel.findOneAndUpdate(
      {
        _id: req.params.comboId,
      },
      {
        $set: {
          isPosSuggest: req.body.isPosSuggest,
        },
      },
      {
        new: true,
      }
    );

    if (!comboData) {
      return res.status(400).json({
        data: null,
        message: "Combo could not be update!",
        success: false,
      });
    }

    return res.status(200).json({
      data: comboData,
      message: "Combo status updated successfully!",
      success: true,
    });
  } catch (e) {
    console.log("*** productController: posSuggestedCombo ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const disableCombo = async (req, res) => {
  try {
    const comboData = await ComboModel.findOneAndUpdate(
      {
        _id: req.params.comboId,
      },
      {
        $set: {
          isOwnDisabled: req.body.isOwnDisabled,
        },
      },
      {
        new: true,
      }
    );

    if (!comboData) {
      return res.status(400).json({
        data: null,
        message: "Combo could not be update!",
        success: false,
      });
    }

    return res.status(200).json({
      data: comboData,
      message: "Combo status updated successfully!",
      success: true,
    });
  } catch (e) {
    console.log("*** productController: posSuggestedCombo ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

const resellerStatusCombo = async (req, res) => {
  try {
    const comboData = await ComboModel.findOneAndUpdate(
      {
        _id: req.params.comboId,
      },
      {
        $set: {
          isReseller: req.body.isReseller,
        },
      },
      {
        new: true,
      }
    );

    if (!comboData) {
      return res.status(400).json({
        data: null,
        message: "Combo could not be update!",
        success: false,
      });
    }

    return res.status(200).json({
      data: comboData,
      message: "Combo status updated successfully!",
      success: true,
    });
  } catch (e) {
    console.log("*** productController: resellerStatusCombo ***");
    console.log("ERROR:", e);
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Server Error Occurred.",
    });
  }
};

module.exports = {
  createCombo,
  updateCombo,
  deleteCombo,
  listOFCombo,
  posListOFCombo,
  viewCombo,
  featuredCombo,
  posSuggestedCombo,
  disableCombo,
  resellerStatusCombo,
};

/*
  create combo
  updateCombo - 
  listOfCombo
  view combo
  
  featuredCombo
  disable combo
  pos combo
  delete combo
*/
