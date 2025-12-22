const router = require("express").Router();
const { celebrate } = require("celebrate");

const homeController = require("../../controllers/home/homeController");
const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const { removeHomeCache } = require("../../redis/homeCache");
const { homeProductsLimiter } = require("../../config/rateLimit");
const settingsValidation = require("../../validators/settingsValidation");

router
  .route("/fetch-options")
  .get([verifyToken, permission("admin", "employee")], homeController.fetchHomeOptions);

router
  .route("/update-options")
  .patch(
    [
      celebrate(settingsValidation.updateHome),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    homeController.updateHomeOptions
  );

router.route("/fetch-products").get([homeProductsLimiter], homeController.fetchAllHomeData);

router
  .route("/reseller/fetch-products")
  .get([homeProductsLimiter], homeController.fetchAllHomeDataForReseller);

router
  .route("/reseller/v2/fetch-products")
  .get([homeProductsLimiter], homeController.fetchAllHomeDataForResellerV2);

// router.route("/test").get([testLimiter], homeController.test);

module.exports = router;
