const router = require("express").Router();
const { celebrate } = require("celebrate");

const homeController = require("../../controllers/home/resellerHomeController");
const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const verifyReseller = require("../../middlewares/verifyReseller");
const allowReseller = require("../../middlewares/allowReseller");
const { homeCache, removeHomeCache } = require("../../redis/homeCache");
const settingsValidation = require("../../validators/settingsValidation");

router
  .route("/fetch-options")
  .get([verifyToken, permission("reseller", "reseller_emp")], homeController.fetchHomeOptions);

router
  .route("/update-options")
  .patch(
    [
      celebrate(settingsValidation.updateHome),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    homeController.updateHomeOptions
  );

router
  .route("/fetch-products")
  .get([homeCache, verifyReseller, allowReseller("active")], homeController.fetchAllHomeData);

router
  .route("/site-color")
  .get([verifyReseller, allowReseller("active")], homeController.fetchSiteColor);

module.exports = router;
