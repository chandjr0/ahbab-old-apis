const order = (orderProjection) => [
  {
    $addFields: {
      products: {
        $map: {
          input: "$products",
          in: {
            $mergeObjects: [
              "$$this",
              {
                productId: {
                  $toObjectId: "$$this.productId",
                },
              },
            ],
          },
        },
      },
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
      from: "products",
      localField: "products.productId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            name: 1,
            slug: 1,
            galleryImage: 1,
            nonVariation: 1,
            // totalStock: 1,
            sku: 1,
          },
        },
      ],
      as: "productsCollection",
    },
  },
  {
    $project: {
      ...orderProjection,
      products: {
        $map: {
          input: "$products",
          as: "i",
          in: {
            $mergeObjects: [
              "$$i",
              {
                $first: {
                  $filter: {
                    input: "$productsCollection",
                    cond: {
                      $eq: ["$$this._id", "$$i.productId"],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    },
  },
];

module.exports = order;
