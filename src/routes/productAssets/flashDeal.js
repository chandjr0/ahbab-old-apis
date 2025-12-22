const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

const flashDealController = require("../../controllers/productAssets/flashDealController");
const flashDealValidation = require("../../validators/flashDealValidation");
const { removeHomeCache } = require("../../redis/homeCache");

router
  .route("/update")
  .post(
    [
      celebrate(flashDealValidation.updateFlashDeal),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    flashDealController.updateFlashDealProduct
  );

router
  .route("/remove-product/:productId")
  .delete(
    [verifyToken, permission("admin", "employee"), removeHomeCache],
    flashDealController.removeProductFromFlashDeal
  );

router
  .route("/fetch")
  .get([verifyToken, permission("admin", "employee")], flashDealController.fetchFlashDealProducts);

router.route("/check-flashdeal").get([removeHomeCache], flashDealController.checkFlashDeal);

router.route("/test").get(flashDealController.test);

module.exports = router;
