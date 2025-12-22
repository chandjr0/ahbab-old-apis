const ProductModel = require("../models/product/product");
const VariationModel = require("../models/product/variation");

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

const category = () => [
  {
    $lookup: {
      from: "categories",
      localField: "categories",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
            slug: 1,
          },
        },
      ],
      as: "categories",
    },
  },
];

const subCategory = () => [
  {
    $lookup: {
      from: "sub_categories",
      let: { id: "$subCategoryId" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
        {
          $project: {
            name: 1,
            slug: 1,
          },
        },
      ],
      as: "subCategory",
    },
  },
  {
    $unwind: {
      path: "$subCategory",
      preserveNullAndEmptyArrays: true,
    },
  },
];

const brand = () => [
  {
    $lookup: {
      from: "brands",
      let: { id: "$brandId" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
        {
          $project: {
            name: 1,
            slug: 1,
          },
        },
      ],
      as: "brand",
    },
  },
  {
    $unwind: {
      path: "$brand",
      preserveNullAndEmptyArrays: true,
    },
  },
];

const sticker = () => [
  {
    $lookup: {
      from: "stickers",
      let: { id: "$stickerId" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
        {
          $project: {
            name: 1,
            color: 1,
          },
        },
      ],
      as: "sticker",
    },
  },
  {
    $unwind: {
      path: "$sticker",
      preserveNullAndEmptyArrays: true,
    },
  },
];

const variations = (isLimit, enableOnly) => {
  let isLimitObj = [
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
    // {
    //   $lookup: {
    //     from: "purchase_prods",
    //     localField: "_id",
    //     foreignField: "variationId",
    //     pipeline: [
    //       {
    //         $match: {
    //           isReceived: true,
    //         },
    //       },
    //       {
    //         $group: {
    //           _id: null,
    //           totalPrice: { $sum: { $multiply: ["$price", "$quantity"] } },
    //           totalQuantity: { $sum: "$quantity" },
    //         },
    //       },
    //     ],
    //     as: "purchaseProducts",
    //   },
    // },
    // {
    //   $unwind: {
    //     path: "$purchaseProducts",
    //     preserveNullAndEmptyArrays: true,
    //   },
    // },
  ];

  if (isLimit) {
    isLimitObj = [
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
        $limit: 1,
      },
    ];
  }

  let matchCondition = {};

  if (enableOnly) {
    matchCondition = {
      isDisabled: false,
    };
  }

  return [
    {
      $lookup: {
        from: "variations",
        localField: "variations",
        foreignField: "_id",
        pipeline: [
          {
            $match: matchCondition,
          },
          ...isLimitObj,
        ],
        as: "variations",
      },
    },
  ];
};

const fullVariations = () => [
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
        // {
        //   $lookup: {
        //     from: "purchase_prods",
        //     localField: "_id",
        //     foreignField: "variationId",
        //     pipeline: [
        //       {
        //         $match: {
        //           isReceived: true,
        //         },
        //       },
        //       {
        //         $group: {
        //           _id: null,
        //           totalPrice: { $sum: { $multiply: ["$price", "$quantity"] } },
        //           totalQuantity: { $sum: "$quantity" },
        //         },
        //       },
        //     ],
        //     as: "purchaseProducts",
        //   },
        // },
        // {
        //   $unwind: {
        //     path: "$purchaseProducts",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
      ],
      as: "variations",
    },
  },
];

const nonVariationPurchase = () => [
  {
    $lookup: {
      from: "purchase_prods",
      let: { pId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$productId", "$$pId"] },
                { $eq: ["$variationId", null] },
                { $eq: ["$isReceived", true] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalPrice: { $sum: { $multiply: ["$price", "$quantity"] } },
            totalQuantity: { $sum: "$quantity" },
          },
        },
      ],
      as: "nonVariationPurchase",
    },
  },
  {
    $unwind: {
      path: "$nonVariationPurchase",
      preserveNullAndEmptyArrays: true,
    },
  },
];

const similarProducts = (productSlug, matchObj) => [
  {
    $lookup: {
      from: "products",
      let: { catIds: "$categories" },
      pipeline: [
        {
          $match: matchObj,
        },
        {
          $sort: {
            totalSell: -1,
          },
        },
        {
          $addFields: {
            stringIds: {
              $map: {
                input: "$$catIds",
                in: { $toString: "$$this" },
              },
            },
          },
        },
        {
          $addFields: {
            categoryId: {
              $map: {
                input: "$categories",
                in: { $toString: "$$this" },
              },
            },
          },
        },
        {
          $unwind: "$categoryId",
        },
        {
          $match: {
            $expr: {
              $and: [
                {
                  $ne: ["$slug", productSlug],
                },
                { $in: ["$categoryId", "$stringIds"] },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            productData: { $push: "$$ROOT" },
          },
        },
        {
          $unwind: {
            path: "$productData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$productData._id",
            productData: { $first: "$productData" },
          },
        },
        {
          $replaceWith: {
            $mergeObjects: ["$$ROOT.productData", { _id: "$$ROOT._id" }],
          },
        },
        // ...category(),
        // ...brand(),
        ...sticker(),
        ...variations(),
        {
          $project: productProjection,
        },
        {
          $limit: 12,
        },
      ],
      as: "similarProducts",
    },
  },
];

const checkProductForOrder = async (product, isStock, isPrice) => {
  const [productData, variationData] = await Promise.all([
    ProductModel.findOne(
      {
        _id: product?.productId,
      },
      {
        name: 1,
        isFlashDeal: 1,
        nonVariation: 1,
      }
    ),
    VariationModel.findOne({
      _id: product?.variationId || null,
    }),
  ]);

  if (!productData) {
    throw new Error(`product not found! (${product?.productId})`);
  }

  if (product?.isVariant && !variationData) {
    throw new Error(`product not found! (${`${product?.name}-${product?.variationId}`})`);
  }

  if (isPrice) {
    if (
      !product?.isVariant &&
      !productData?.isFlashDeal &&
      productData?.nonVariation?.sellingPrice !== product.price
    ) {
      throw new Error(
        `'${productData?.name}'- price is ${productData?.nonVariation?.sellingPrice} not ${product?.price}`
      );
    } else if (
      !product?.isVariant &&
      productData?.isFlashDeal &&
      productData?.nonVariation?.flashPrice !== product.price
    ) {
      throw new Error(
        `'${productData?.name}'- price is ${productData?.nonVariation?.flashPrice} not ${product?.price}`
      );
    } else if (
      product?.isVariant &&
      !productData?.isFlashDeal &&
      variationData?.sellingPrice !== product.price
    ) {
      throw new Error(
        `${productData?.name}${product?.isVariant && `(${product?.variationName})`}- price is ${
          variationData?.sellingPrice
        } not ${product?.price}`
      );
    } else if (
      product?.isVariant &&
      productData?.isFlashDeal &&
      variationData?.flashPrice !== product.price
    ) {
      throw new Error(
        `${productData?.name}${product?.isVariant && `(${product?.variationName})`}- price is ${
          variationData?.flashPrice
        } not ${product?.price}`
      );
    }
  }

  if (isStock) {
    if (product?.isVariant && variationData?.stock < product?.quantity) {
      throw new Error(
        `${productData?.name}${product?.isVariant && `(${product?.variationName})`} - has ${
          variationData?.stock
        } Qty. You Select ${product?.quantity} Qty.`
      );
    } else if (!product?.isVariant && productData?.nonVariation?.stock < product?.quantity) {
      throw new Error(
        `${productData?.name} - has ${productData?.nonVariation?.stock} Qty. You Select ${product?.quantity} Qty.`
      );
    }
  }
};

const updateProductStock = async (product, ally) => {
  // ally = 1 (add stock) or -1 (less stock)
  const [productData, variationData] = await Promise.all([
    ProductModel.findOne({
      _id: product?.productId,
    }),
    VariationModel.findOne({
      _id: product?.variationId || null,
    }),
  ]);

  if (product?.isVariant) {
    variationData.stock += ally * product.quantity;
    variationData.sellQty += -1 * ally * product.quantity;

    variationData.isUsed = true;
    await variationData.save();
  } else {
    productData.nonVariation.stock += ally * product.quantity;
    productData.nonVariation.sellQty += -1 * ally * product.quantity;
  }

  productData.totalStock += ally * product.quantity;
  productData.totalSell += -1 * ally * product.quantity;
  productData.totalSellingPrice += -1 * ally * product.price;

  productData.isUsed = true;
  /*
  if (productData?.totalSell > 0) {
    productData.isUsed = true;
  } else {
    productData.isUsed = false;
  } */
  await productData.save();
};

const updateProductReturnStock = async (product, stockBalance) => {
  const [productData, variationData] = await Promise.all([
    ProductModel.findOne({
      _id: product?.productId,
    }),
    VariationModel.findOne({
      _id: product?.variationId || null,
    }),
  ]);

  if (product?.isVariant) {
    variationData.stock += stockBalance;
    await variationData.save();
  } else {
    productData.nonVariation.stock += stockBalance;
  }

  productData.totalStock += stockBalance;
  productData.totalSell += -1 * stockBalance;
  productData.totalSellingPrice += -1 * stockBalance * product.price;

  // if (productData.totalStock < 0) {
  //   productData.totalStock = 0;
  // }

  await productData.save();
};

module.exports = {
  category,
  subCategory,
  brand,
  sticker,
  variations,
  fullVariations,
  nonVariationPurchase,
  similarProducts,
  checkProductForOrder,
  updateProductStock,
  updateProductReturnStock,
};
