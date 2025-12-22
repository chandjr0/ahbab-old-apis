const ResellerModel = require("../models/user/reseller");

const verifyToken = async (req, res, next) => {
  // console.log("req.headers.api_key: ", req.query.api_key);
  // console.log("req.headers.api_key: ", req.headers.api_key);

  // if (!req.headers.api_key) {
  //   return res.status(401).json({
  //     success: false,
  //     message: "Unauthorized reseller site!",
  //   });
  // }

  if (!req.query.api_key) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized reseller site!",
    });
  }

  try {
    const resellerData = await ResellerModel.findOne(
      {
        apiKey: req.query.api_key,
      },
      {
        _id: 1,
        role: 1,
        status: 1,
        website: "$website.domain",
      }
    ).lean();

    if (!resellerData) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized reseller!",
      });
    }

    req.reseller = resellerData;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = verifyToken;
