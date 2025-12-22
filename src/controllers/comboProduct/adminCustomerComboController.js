const ComboModel = require("../../models/comboProduct/combo");
const customMetaData = require("../../helpers/customMetaData");
const { enableComboFull } = require("../../helpers/comboProduct");

const comboProjection = {
  name: 1,
  slug: 1,
  sku: 1,
  galleryImage: 1,
  regularPrice: 1,
  sellingPrice: 1,
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
        isOwnDisabled: { $eq: false },
      },
    ];

    const [comboData, totalData] = await Promise.all([
      ComboModel.aggregate([
        {
          $match: {
            $and: matchCondition,
          },
        },
        {
          $project: comboProjection,
        },
        {
          $sort: {
            isFeatured: -1,
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
    console.log("*** adminCustomerComboController: listOFCombo ***");
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
    console.log("*** adminCustomerComboController: viewCombo ***");
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
  viewCombo,
};
