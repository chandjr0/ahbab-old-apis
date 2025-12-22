const pagination = (pPage, pLimit) => ({
  $facet: {
    metadata: [
      { $count: "totalData" },
      {
        $addFields: {
          page: pPage,
          limit: pLimit,
        },
      },
      {
        $project: {
          page: 1,
          limit: 1,
          totalData: 1,
          totalPage: {
            $cond: {
              if: { $lte: ["$totalData", 0] },
              then: 0,
              else: {
                $cond: {
                  if: { $lt: ["$totalData", pLimit] },
                  then: 1,
                  else: { $ceil: { $divide: ["$totalData", pLimit] } },
                },
              },
            },
          },
        },
      },
    ],
    data: [{ $skip: pLimit * (pPage - 1) }, { $limit: pLimit }],
  },
});

module.exports = pagination;
