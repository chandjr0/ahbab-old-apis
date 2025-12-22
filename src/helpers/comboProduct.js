// admin

const adminComboFull = [
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
            sellingPrice: 1,
          },
        },
      ],
      as: "variations",
    },
  },
];

const resellerComboFull = [
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
            sellingPrice: 1,
          },
        },
      ],
      as: "variations",
    },
  },
];

const enableComboFull = [
  {
    $lookup: {
      from: "variations",
      localField: "variations",
      foreignField: "_id",
      pipeline: [
        {
          $match: {
            isDeleted: false,
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
            sellingPrice: 1,
          },
        },
      ],
      as: "variations",
    },
  },
];

module.exports = {
  // admin
  adminComboFull,
  resellerComboFull,
  enableComboFull,
};
