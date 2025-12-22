// const { redisClient } = require("./index");

const homeCache = async (req, res, next) => {
  return next();
  // let results;
  // try {
    // const cacheResults = await redisClient.get(`${process.env.REDIS_NAME}:homeData`);

    // if (cacheResults) {
    //   results = JSON.parse(cacheResults);
    //   return res.status(200).json({
    //     data: results,
    //     message: "result from cache successfully",
    //     success: true,
    //   });
    // }

  //   return next();
  // } catch (error) {
  //   // console.error("cache error");
  //   return next();
  // }
};

const removeHomeCache = async (req, res, next) => {
  return next();
  // try {
  //   await redisClient.DEL(`${process.env.REDIS_NAME}:homeData`);
  //   next();
  // } catch (error) {
  //   console.error("Error removing home cache:", error);
  //   next(error);
  // }
};

module.exports = {
  homeCache,
  removeHomeCache,
};
