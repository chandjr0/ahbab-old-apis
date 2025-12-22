const ComboModel = require("../../models/comboProduct/combo");
const customMetaData = require("../../helpers/customMetaData");
const { resellerComboFull, enableComboFull } = require("../../helpers/comboProduct");

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
    name: 1,
    slug: 1,
    sku: 1,
    galleryImage: 1,
    isVariant: 1,
    price: 1,
  },
};

const listOFCombo = async (req, res) => {
  try {
    const page = Math.max(1, req.query.page) || 1;
    const pageLimit = Math.max(1, req.query.limit) || 1;

    const matchCondition = [
      {
        isDeleted: { $eq: false },
      },
      {
        isReseller: { $eq: true },
      },
      {
        isOwnDisabled: { $eq: false },
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
        isDeleted: { $eq: false },
      },
      {
        isReseller: { $eq: true },
      },
      {
        isOwnDisabled: { $eq: false },
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
                    ...resellerComboFull,
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
          isDeleted: false,
          isReseller: true,
          isOwnDisabled: false,
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
                  ...enableComboFull,
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
      {
        $project: {
          ...comboProjection,
          description: 1,
          guideline: 1,
          comboProduct: {
            name: 1,
            slug: 1,
            sku: 1,
            galleryImage: 1,
            isVariant: 1,
            price: 1,
            variations: 1,
            productId: 1,
            "nonVariation.sellingPrice": 1,
          },
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

module.exports = {
  listOFCombo,
  posListOFCombo,
  viewCombo,
};
