const adminOrderPopulate = [
  {
    $lookup: {
      from: "admin_order_products",
      let: { pId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$orderId", "$$pId"] } } },
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
                  "nonVariation.stock": 1,
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
            localField: "variationId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  images: 1,
                  stock: 1,
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
        {
          $project: {
            product: 1,
            variation: 1,
            isVariant: 1,
            variationName: 1,
            quantity: 1,
            price: 1,
            returnQty: 1,
          },
        },
      ],
      as: "products",
    },
  },
  {
    $lookup: {
      from: "admin_order_combos",
      localField: "_id",
      foreignField: "orderId",
      pipeline: [
        {
          $lookup: {
            from: "admin_order_combo_products",
            localField: "_id",
            foreignField: "orderComboId",
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
                        "nonVariation.stock": 1,
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
                  localField: "variationId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        images: 1,
                        stock: 1,
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
              {
                $project: {
                  product: 1,
                  variation: 1,
                  isVariant: 1,
                  variationName: 1,
                  returnQty: 1,
                },
              },
            ],
            as: "comboProducts",
          },
        },
        {
          $lookup: {
            from: "combos",
            localField: "comboId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  slug: 1,
                  galleryImage: 1,
                  sku: 1,
                },
              },
            ],
            as: "comboData",
          },
        },
        {
          $unwind: {
            path: "$comboData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $replaceRoot: {
            newRoot: { $mergeObjects: ["$comboData", "$$ROOT"] },
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            sku: 1,
            galleryImage: 1,
            quantity: 1,
            price: 1,
            returnQty: 1,
            comboProducts: 1,
            comboId: 1,
          },
        },
      ],
      as: "combos",
    },
  },
  {
    $lookup: {
      from: "couriers",
      localField: "courierId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
          },
        },
      ],
      as: "courierData",
    },
  },
  {
    $unwind: {
      path: "$courierData",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "logs",
      let: { pId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$referObjectId", "$$pId"] } } },
        {
          $sort: {
            created: 1,
          },
        },
        {
          $project: {
            message: 1,
            time: 1,
          },
        },
      ],
      as: "updateHistory",
    },
  },
  {
    $lookup: {
      from: "pathao_cities",
      localField: "deliveryAddress.cityId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            city_id: 1,
            city_name: 1,
          },
        },
      ],
      as: "deliveryAddress.city",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.city",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_zones",
      localField: "deliveryAddress.zoneId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            zone_id: 1,
            zone_name: 1,
          },
        },
      ],
      as: "deliveryAddress.zone",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.zone",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_areas",
      localField: "deliveryAddress.areaId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            area_id: 1,
            area_name: 1,
          },
        },
      ],
      as: "deliveryAddress.area",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.area",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      "deliveryAddress.cityId": 0,
      "deliveryAddress.zoneId": 0,
      "deliveryAddress.areaId": 0,
    },
  },
];

const adminIncompleteOrderPopulate = [
  {
    $lookup: {
      from: "admin_order_product_incompletes",
      let: { pId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$orderId", "$$pId"] } } },
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
                  "nonVariation.stock": 1,
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
            localField: "variationId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  images: 1,
                  stock: 1,
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
        {
          $project: {
            product: 1,
            variation: 1,
            isVariant: 1,
            variationName: 1,
            quantity: 1,
            price: 1,
            returnQty: 1,
          },
        },
      ],
      as: "products",
    },
  },
  {
    $lookup: {
      from: "couriers",
      localField: "courierId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
          },
        },
      ],
      as: "courierData",
    },
  },
  {
    $unwind: {
      path: "$courierData",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "logs",
      let: { pId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$referObjectId", "$$pId"] } } },
        {
          $sort: {
            created: 1,
          },
        },
        {
          $project: {
            message: 1,
            time: 1,
          },
        },
      ],
      as: "updateHistory",
    },
  },
  {
    $lookup: {
      from: "pathao_cities",
      localField: "deliveryAddress.cityId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            city_id: 1,
            city_name: 1,
          },
        },
      ],
      as: "deliveryAddress.city",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.city",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_zones",
      localField: "deliveryAddress.zoneId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            zone_id: 1,
            zone_name: 1,
          },
        },
      ],
      as: "deliveryAddress.zone",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.zone",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_areas",
      localField: "deliveryAddress.areaId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            area_id: 1,
            area_name: 1,
          },
        },
      ],
      as: "deliveryAddress.area",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.area",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      "deliveryAddress.cityId": 0,
      "deliveryAddress.zoneId": 0,
      "deliveryAddress.areaId": 0,
    },
  },
];

const resellerOrderPopulate = [
  {
    $lookup: {
      from: "reseller_order_products",
      let: { pId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$orderId", "$$pId"] } } },
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
                  "nonVariation.stock": 1,
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
            localField: "variationId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  images: 1,
                  stock: 1,
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
        {
          $project: {
            product: 1,
            variation: 1,
            isVariant: 1,
            variationName: 1,
            quantity: 1,
            price: 1,
            returnQty: 1,
            resellerInfo: 1,
          },
        },
      ],
      as: "products",
    },
  },
  {
    $lookup: {
      from: "reseller_order_combos",
      localField: "_id",
      foreignField: "orderId",
      pipeline: [
        {
          $lookup: {
            from: "reseller_order_combo_products",
            localField: "orderId",
            foreignField: "orderId",
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
                        "nonVariation.stock": 1,
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
                  localField: "variationId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        images: 1,
                        stock: 1,
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
              {
                $project: {
                  product: 1,
                  variation: 1,
                  isVariant: 1,
                  variationName: 1,
                  returnQty: 1,
                },
              },
            ],
            as: "comboProducts",
          },
        },
        {
          $lookup: {
            from: "combos",
            localField: "comboId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  slug: 1,
                  galleryImage: 1,
                  sku: 1,
                },
              },
            ],
            as: "comboData",
          },
        },
        {
          $unwind: {
            path: "$comboData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $replaceRoot: {
            newRoot: { $mergeObjects: ["$comboData", "$$ROOT"] },
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            sku: 1,
            galleryImage: 1,
            quantity: 1,
            price: 1,
            returnQty: 1,
            comboProducts: 1,
            comboId: 1,
          },
        },
      ],
      as: "combos",
    },
  },
  {
    $lookup: {
      from: "couriers",
      localField: "courierId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
          },
        },
      ],
      as: "courierData",
    },
  },
  {
    $unwind: {
      path: "$courierData",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "logs",
      let: { pId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$referObjectId", "$$pId"] } } },
        {
          $sort: {
            created: 1,
          },
        },
        {
          $project: {
            message: 1,
            time: 1,
          },
        },
      ],
      as: "updateHistory",
    },
  },
  {
    $lookup: {
      from: "pathao_cities",
      localField: "deliveryAddress.cityId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            city_id: 1,
            city_name: 1,
          },
        },
      ],
      as: "deliveryAddress.city",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.city",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_zones",
      localField: "deliveryAddress.zoneId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            zone_id: 1,
            zone_name: 1,
          },
        },
      ],
      as: "deliveryAddress.zone",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.zone",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_areas",
      localField: "deliveryAddress.areaId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            area_id: 1,
            area_name: 1,
          },
        },
      ],
      as: "deliveryAddress.area",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.area",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      "deliveryAddress.cityId": 0,
      "deliveryAddress.zoneId": 0,
      "deliveryAddress.areaId": 0,
    },
  },
];

const resellerOrderAdminPopulate = [
  {
    $lookup: {
      from: "reseller_order_products",
      let: { pId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$orderId", "$$pId"] } } },
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
                  "nonVariation.stock": 1,
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
            localField: "variationId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  images: 1,
                  stock: 1,
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
        {
          $project: {
            product: 1,
            variation: 1,
            isVariant: 1,
            variationName: 1,
            quantity: 1,
            price: 1,
            returnQty: 1,
            resellerInfo: 1,
          },
        },
      ],
      as: "products",
    },
  },
  {
    $lookup: {
      from: "reseller_order_combos",
      localField: "_id",
      foreignField: "orderId",
      pipeline: [
        {
          $lookup: {
            from: "reseller_order_combo_products",
            localField: "_id",
            foreignField: "orderComboId",
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
                        "nonVariation.stock": 1,
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
                  localField: "variationId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        images: 1,
                        stock: 1,
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
              {
                $project: {
                  product: 1,
                  variation: 1,
                  isVariant: 1,
                  variationName: 1,
                  returnQty: 1,
                },
              },
            ],
            as: "comboProducts",
          },
        },
        {
          $lookup: {
            from: "combos",
            localField: "comboId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: 1,
                  slug: 1,
                  galleryImage: 1,
                  sku: 1,
                },
              },
            ],
            as: "comboData",
          },
        },
        {
          $unwind: {
            path: "$comboData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $replaceRoot: {
            newRoot: { $mergeObjects: ["$comboData", "$$ROOT"] },
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            sku: 1,
            galleryImage: 1,
            quantity: 1,
            price: 1,
            returnQty: 1,
            comboProducts: 1,
            comboId: 1,
          },
        },
      ],
      as: "combos",
    },
  },
  {
    $lookup: {
      from: "couriers",
      localField: "courierId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
          },
        },
      ],
      as: "courierData",
    },
  },
  {
    $unwind: {
      path: "$courierData",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "resellers",
      localField: "resellerInfo.resellerId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
            phone: 1,
            email: 1,
            image: 1,
            logoImg: 1,
            address: 1,
            generalSettingPhone: 1
          },
        },
      ],
      as: "resellerInfo.reseller",
    },
  },
  {
    $unwind: {
      path: "$resellerInfo.reseller",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "logs",
      let: { pId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$referObjectId", "$$pId"] } } },
        {
          $sort: {
            created: 1,
          },
        },
        {
          $project: {
            message: 1,
            time: 1,
          },
        },
      ],
      as: "updateHistory",
    },
  },
  {
    $lookup: {
      from: "pathao_cities",
      localField: "deliveryAddress.cityId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            city_id: 1,
            city_name: 1,
          },
        },
      ],
      as: "deliveryAddress.city",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.city",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_zones",
      localField: "deliveryAddress.zoneId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            zone_id: 1,
            zone_name: 1,
          },
        },
      ],
      as: "deliveryAddress.zone",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.zone",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_areas",
      localField: "deliveryAddress.areaId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            area_id: 1,
            area_name: 1,
          },
        },
      ],
      as: "deliveryAddress.area",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.area",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      "deliveryAddress.cityId": 0,
      "deliveryAddress.zoneId": 0,
      "deliveryAddress.areaId": 0,
    },
  },
];

const bulkOrderPopulate = [
  {
    $lookup: {
      from: "pathao_cities",
      localField: "deliveryAddress.cityId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            city_id: 1,
            city_name: 1,
          },
        },
      ],
      as: "deliveryAddress.city",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.city",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_zones",
      localField: "deliveryAddress.zoneId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            zone_id: 1,
            zone_name: 1,
          },
        },
      ],
      as: "deliveryAddress.zone",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.zone",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_areas",
      localField: "deliveryAddress.areaId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            area_id: 1,
            area_name: 1,
          },
        },
      ],
      as: "deliveryAddress.area",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.area",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      "deliveryAddress.cityId": 0,
      "deliveryAddress.zoneId": 0,
      "deliveryAddress.areaId": 0,
    },
  },
  {
    $project: {
      _id: 1,
      serialId: 1,
      totalWeight: 1,
      totalQty: 1,
      deliveryAddress: 1,
      customerCharge: 1,
    },
  },
];

const resellerOrderPaymentAdminPopulate = [
  {
    $lookup: {
      from: "reseller_order_products",
      let: { pId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$orderId", "$$pId"] } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ],
      as: "products",
    },
  },
  {
    $unwind: {
      path: "$products",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "couriers",
      localField: "courierId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
          },
        },
      ],
      as: "courierData",
    },
  },
  {
    $unwind: {
      path: "$courierData",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "resellers",
      localField: "resellerInfo.resellerId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
            phone: 1,
            email: 1,
          },
        },
      ],
      as: "resellerInfo.reseller",
    },
  },
  {
    $unwind: {
      path: "$resellerInfo.reseller",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_cities",
      localField: "deliveryAddress.cityId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            city_id: 1,
            city_name: 1,
          },
        },
      ],
      as: "deliveryAddress.city",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.city",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_zones",
      localField: "deliveryAddress.zoneId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            zone_id: 1,
            zone_name: 1,
          },
        },
      ],
      as: "deliveryAddress.zone",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.zone",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "pathao_areas",
      localField: "deliveryAddress.areaId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            area_id: 1,
            area_name: 1,
          },
        },
      ],
      as: "deliveryAddress.area",
    },
  },
  {
    $unwind: {
      path: "$deliveryAddress.area",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      "deliveryAddress.cityId": 0,
      "deliveryAddress.zoneId": 0,
      "deliveryAddress.areaId": 0,
    },
  },
];

module.exports = {
  adminOrderPopulate,
  adminIncompleteOrderPopulate,
  resellerOrderPopulate,
  resellerOrderAdminPopulate,
  bulkOrderPopulate,
  resellerOrderPaymentAdminPopulate,
};
