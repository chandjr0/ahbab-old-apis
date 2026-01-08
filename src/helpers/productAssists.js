// Helper to check if value is empty (null, undefined, or empty string)
function isEmpty(val) {
  return val == null || val === "" || val === undefined;
}

function nestedCategories(categories, pId = null, subPId = null) {
  const categoryList = [];
  let category;

  // Filter categories based on parentId or subParentId
  // Handle both null and empty string (CSV import stores empty string instead of null)
  if (pId == null && subPId == null) {
    category = categories.filter((cat) => isEmpty(cat.parentId) && isEmpty(cat.subParentId));
  } else if (pId != null && subPId == null) {
    category = categories.filter((cat) => String(cat.parentId) === String(pId));
  } else {
    category = categories.filter((cat) => String(cat.subParentId) === String(subPId));
  }

  category.forEach((cate) => {
    categoryList.push({
      ...JSON.parse(JSON.stringify(cate)),
      children: nestedCategories(categories, cate._id, null), // Recursive for parentId
      subChildren: nestedCategories(categories, null, cate._id), // Recursive for subParentId
    });
  });

  return categoryList;
}


// admin
const adminProductCard = [
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
            purchaseQty: 1,
            totalPurchasePrice: 1,
            sellQty: 1,
            totalSellPrice: 1,
            isDisabled: 1,
          },
        },
      ],
      as: "variations",
    },
  },
];

const adminProductFull = [
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
  {
    $lookup: {
      from: "stickers",
      localField: "stickerId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
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
            discount: 1,
            sellingPrice: 1,
            flashPrice: 1,
            purchaseQty: 1,
            totalPurchasePrice: 1,
            sellQty: 1,
            totalSellPrice: 1,
            isDisabled: 1,
            isUsed: 1,
          },
        },
      ],
      as: "variations",
    },
  },
];

const adminCustomerProductCard = [
  {
    $lookup: {
      from: "stickers",
      localField: "stickerId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
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
          $project: {
            stock: 1,
            regularPrice: 1,
            sellingPrice: 1,
            discount: 1,
            flashPrice: 1,
            images: 1,
          },
        },
        // {
        //   $limit: 1,
        // },
      ],
      as: "variations",
    },
  },
];

const adminCustomerProductFull = [
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
  {
    $lookup: {
      from: "stickers",
      localField: "stickerId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
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
            stock: 1,
            regularPrice: 1,
            sellingPrice: 1,
            discount: 1,
            flashPrice: 1,
            images: 1,
            attributeOpts: 1,
          },
        },
      ],
      as: "variations",
    },
  },
];

// reseller
const resellerProductCard = [
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
            sellQty: 1,
            totalSellPrice: 1,
            isDisabled: 1,
          },
        },
      ],
      as: "variations",
    },
  },
];

const resellerProductFull = [
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
  {
    $lookup: {
      from: "stickers",
      localField: "stickerId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
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
            isUsed: 1,
          },
        },
      ],
      as: "variations",
    },
  },
];

const resellerCustomerProductCard = [
  {
    $lookup: {
      from: "stickers",
      localField: "stickerId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
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
          $project: {
            stock: 1,
            regularPrice: 1,
            sellingPrice: 1,
            discount: 1,
            flashPrice: 1,
            images: 1,
          },
        },
        {
          $limit: 1,
        },
      ],
      as: "variations",
    },
  },
];

const resellerCustomerProductFull = [
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
  {
    $lookup: {
      from: "stickers",
      localField: "stickerId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
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
            stock: 1,
            regularPrice: 1,
            sellingPrice: 1,
            discount: 1,
            flashPrice: 1,
            images: 1,
            attributeOpts: 1,
          },
        },
      ],
      as: "variations",
    },
  },
];

/**
 * Transform flat bracket fields (from CSV import) to arrays
 * Handles categories[0], categories[1]... and galleryImage[0], galleryImage[1]...
 * Also normalizes boolean strings to actual booleans and ensures numeric fields are numbers
 * This should be added AFTER adminCustomerProductCard but BEFORE $project
 */
const transformFlatFieldsToArrays = [
  {
    $addFields: {
      // Transform categories flat fields to array and convert strings to ObjectIds
      categories: {
        $cond: {
          if: { $isArray: "$categories" },
          then: "$categories",
          else: {
            $map: {
              input: {
                $filter: {
                  input: [
                    { $ifNull: [{ $getField: { field: "categories[0]", input: "$$ROOT" } }, null] },
                    { $ifNull: [{ $getField: { field: "categories[1]", input: "$$ROOT" } }, null] },
                    { $ifNull: [{ $getField: { field: "categories[2]", input: "$$ROOT" } }, null] },
                    { $ifNull: [{ $getField: { field: "categories[3]", input: "$$ROOT" } }, null] },
                    { $ifNull: [{ $getField: { field: "categories[4]", input: "$$ROOT" } }, null] },
                    { $ifNull: [{ $getField: { field: "categories[5]", input: "$$ROOT" } }, null] },
                    { $ifNull: [{ $getField: { field: "categories[6]", input: "$$ROOT" } }, null] },
                    { $ifNull: [{ $getField: { field: "categories[7]", input: "$$ROOT" } }, null] },
                    { $ifNull: [{ $getField: { field: "categories[8]", input: "$$ROOT" } }, null] },
                    { $ifNull: [{ $getField: { field: "categories[9]", input: "$$ROOT" } }, null] }
                  ],
                  as: "cat",
                  cond: { $and: [{ $ne: ["$$cat", ""] }, { $ne: ["$$cat", null] }, { $ne: ["$$cat", undefined] }] }
                }
              },
              as: "catId",
              in: {
                $cond: {
                  if: { $eq: [{ $type: "$$catId" }, "string"] },
                  then: { $toObjectId: "$$catId" },
                  else: "$$catId"
                }
              }
            }
          }
        }
      },
      // Transform galleryImage flat fields to array
      galleryImage: {
        $cond: {
          if: { $isArray: "$galleryImage" },
          then: "$galleryImage",
          else: {
            $filter: {
              input: [
                { $ifNull: [{ $getField: { field: "galleryImage[0]", input: "$$ROOT" } }, null] },
                { $ifNull: [{ $getField: { field: "galleryImage[1]", input: "$$ROOT" } }, null] },
                { $ifNull: [{ $getField: { field: "galleryImage[2]", input: "$$ROOT" } }, null] },
                { $ifNull: [{ $getField: { field: "galleryImage[3]", input: "$$ROOT" } }, null] },
                { $ifNull: [{ $getField: { field: "galleryImage[4]", input: "$$ROOT" } }, null] },
                { $ifNull: [{ $getField: { field: "galleryImage[5]", input: "$$ROOT" } }, null] },
                { $ifNull: [{ $getField: { field: "galleryImage[6]", input: "$$ROOT" } }, null] },
                { $ifNull: [{ $getField: { field: "galleryImage[7]", input: "$$ROOT" } }, null] },
                { $ifNull: [{ $getField: { field: "galleryImage[8]", input: "$$ROOT" } }, null] },
                { $ifNull: [{ $getField: { field: "galleryImage[9]", input: "$$ROOT" } }, null] }
              ],
              as: "img",
              cond: { $and: [{ $ne: ["$$img", ""] }, { $ne: ["$$img", null] }, { $ne: ["$$img", undefined] }] }
            }
          }
        }
      },
      // Normalize boolean strings to actual booleans (CSV import stores as strings)
      isVariant: {
        $cond: {
          if: { $eq: [{ $type: "$isVariant" }, "string"] },
          then: {
            $cond: {
              if: { $in: ["$isVariant", ["true", "True", "TRUE", "1"]] },
              then: true,
              else: {
                $cond: {
                  if: { $in: ["$isVariant", ["false", "False", "FALSE", "0", ""]] },
                  then: false,
                  else: "$isVariant"
                }
              }
            }
          },
          else: "$isVariant"
        }
      },
      isFlashDeal: {
        $cond: {
          if: { $eq: [{ $type: "$isFlashDeal" }, "string"] },
          then: {
            $cond: {
              if: { $in: ["$isFlashDeal", ["true", "True", "TRUE", "1"]] },
              then: true,
              else: {
                $cond: {
                  if: { $in: ["$isFlashDeal", ["false", "False", "FALSE", "0", ""]] },
                  then: false,
                  else: "$isFlashDeal"
                }
              }
            }
          },
          else: "$isFlashDeal"
        }
      },
      // Normalize nonVariation stock and prices to numbers
      nonVariation: {
        $cond: {
          if: { $ne: ["$nonVariation", null] },
          then: {
            stock: {
              $cond: {
                if: { $eq: [{ $type: "$nonVariation.stock" }, "string"] },
                then: { $toDouble: { $ifNull: ["$nonVariation.stock", 0] } },
                else: { $ifNull: ["$nonVariation.stock", 0] }
              }
            },
            regularPrice: {
              $cond: {
                if: { $eq: [{ $type: "$nonVariation.regularPrice" }, "string"] },
                then: { $toDouble: { $ifNull: ["$nonVariation.regularPrice", 0] } },
                else: { $ifNull: ["$nonVariation.regularPrice", 0] }
              }
            },
            sellingPrice: {
              $cond: {
                if: { $eq: [{ $type: "$nonVariation.sellingPrice" }, "string"] },
                then: { $toDouble: { $ifNull: ["$nonVariation.sellingPrice", 0] } },
                else: { $ifNull: ["$nonVariation.sellingPrice", 0] }
              }
            },
            flashPrice: {
              $cond: {
                if: { $eq: [{ $type: "$nonVariation.flashPrice" }, "string"] },
                then: { $toDouble: { $ifNull: ["$nonVariation.flashPrice", 0] } },
                else: { $ifNull: ["$nonVariation.flashPrice", 0] }
              }
            },
            discount: "$nonVariation.discount"
          },
          else: "$nonVariation"
        }
      },
      // Normalize variations array stock and prices to numbers
      variations: {
        $cond: {
          if: { $isArray: "$variations" },
          then: {
            $map: {
              input: "$variations",
              as: "variation",
              in: {
                $mergeObjects: [
                  "$$variation",
                  {
                    stock: {
                      $cond: {
                        if: { $eq: [{ $type: "$$variation.stock" }, "string"] },
                        then: { $toDouble: { $ifNull: ["$$variation.stock", 0] } },
                        else: { $ifNull: ["$$variation.stock", 0] }
                      }
                    },
                    regularPrice: {
                      $cond: {
                        if: { $eq: [{ $type: "$$variation.regularPrice" }, "string"] },
                        then: { $toDouble: { $ifNull: ["$$variation.regularPrice", 0] } },
                        else: { $ifNull: ["$$variation.regularPrice", 0] }
                      }
                    },
                    sellingPrice: {
                      $cond: {
                        if: { $eq: [{ $type: "$$variation.sellingPrice" }, "string"] },
                        then: { $toDouble: { $ifNull: ["$$variation.sellingPrice", 0] } },
                        else: { $ifNull: ["$$variation.sellingPrice", 0] }
                      }
                    },
                    flashPrice: {
                      $cond: {
                        if: { $eq: [{ $type: "$$variation.flashPrice" }, "string"] },
                        then: { $toDouble: { $ifNull: ["$$variation.flashPrice", 0] } },
                        else: { $ifNull: ["$$variation.flashPrice", 0] }
                      }
                    }
                  }
                ]
              }
            }
          },
          else: "$variations"
        }
      }
    }
  }
];

module.exports = {
  nestedCategories,

  // admin
  adminProductCard,
  adminProductFull,
  adminCustomerProductCard,
  adminCustomerProductFull,

  // reseller
  resellerProductCard,
  resellerProductFull,
  resellerCustomerProductCard,
  resellerCustomerProductFull,

  // CSV import transformation helper
  transformFlatFieldsToArrays,
};
