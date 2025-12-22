const chalk = require("chalk");
const { isCelebrateError } = require("celebrate");
const logger = require("./logger");

module.exports = (app) => {
  app.use((_req, _res, next) => {
    const error = new Error("API not found");
    error.status = 404;
    next(error);
  });

  app.use((err, req, res, next) => {
    if (isCelebrateError(err)) {
      let errorMsg = "Validation Error!";

      const errorBody = err.details.get("body");
      if (errorBody) {
        errorMsg = errorBody.details[0].message;
      }

      const errorParam = err.details.get("params");
      if (errorParam) {
        errorMsg = errorParam.details[0].message;
      }

      const errorQuery = err.details.get("query");
      if (errorQuery) {
        errorMsg = errorQuery.details[0].message;
      }

      return res.status(400).json({
        data: null,
        message: errorMsg,
        success: false,
      });
    }

    res.status(err.status || 500).json({
      message: err.message || "something went wrong",
      success: false,
    });
    logger.error(chalk.red(`${err.message}`));
    return next();
  });
};
