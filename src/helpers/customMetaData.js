const customMetaData = (pPage, pLimit, totalData) => ({
  totalData,
  page: pPage,
  limit: pLimit,
  totalPage: Math.ceil((totalData || 0) / pLimit),
});

module.exports = customMetaData;
