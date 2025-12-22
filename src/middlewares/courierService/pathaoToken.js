const axios = require("axios");
const jwt = require("jsonwebtoken");
// const PathaoServiceModel = require("../../models/courierServices/pathaoService");
const CourierApiModel = require("../../models/courierServices/courierApi");

const verifyToken = async (req, res, next) => {
  try {
    const pathaoServiceData = await CourierApiModel.findOne({}, { pathao: 1 });

    // Perform basic checks
    const decoded = jwt.decode(pathaoServiceData?.pathao?.accessToken);

    if (
      !pathaoServiceData?.pathao.accessToken ||
      (decoded.exp && decoded.exp < Date.now() / 1000) ||
      (decoded.nbf && decoded.nbf > Date.now() / 1000)
    ) {
      console.error("Token has expired");
      const bodyObj = {
        client_id: pathaoServiceData?.pathao?.PATHAO_CLIENT_ID,
        client_secret: pathaoServiceData?.pathao?.PATHAO_CLIENT_SECRET,
        username: pathaoServiceData?.pathao?.PATHAO_USERNAME,
        password: pathaoServiceData?.pathao?.PATHAO_PASSWORD,
        grant_type: pathaoServiceData?.pathao?.PATHAO_GRANT_TYPE,
      };
      const result = await axios.post(
        `${pathaoServiceData?.pathao?.PATHAO_BASE}/issue-token`,
        bodyObj
      );

      if (result?.type === "error") {
        return next("Invalid pathao user");
      }

      pathaoServiceData.pathao.accessToken = result?.data?.access_token;
      await pathaoServiceData.save();
      req.pathao = pathaoServiceData?.pathao;
    } else {
      console.log("Token is valid:");
      req.pathao = pathaoServiceData?.pathao;
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = verifyToken;
