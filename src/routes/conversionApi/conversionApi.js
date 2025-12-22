const router = require("express").Router();
const { celebrate } = require("celebrate");

const conversionController = require("../../controllers/conversionApi/conversionApi");
const conversionApiValidation = require("../../validators/conversionApi");

// const permission = require("../../middlewares/permission");
const verifyReseller = require("../../middlewares/verifyReseller");
// const verifyToken = require("../../middlewares/verifyToken");
// const verifyTokenOrAvoid = require("../../middlewares/verifyTokenOrAvoid");
// const allowReseller = require("../../middlewares/allowReseller");

router.route("/admin/events").post(conversionController.adminFbEvents);

router.route("/reseller/events").post([verifyReseller], conversionController.resellerFbEvents);

router
  .route("/admin/sdk-events")
  .post(
    // [celebrate(conversionApiValidation.adminFbEventsSDK)],
    conversionController.adminFbEventsSDK
  );

router
  .route("/reseller/sdk-events")
  .post(
    [verifyReseller, celebrate(conversionApiValidation.adminFbEventsSDK)],
    conversionController.resellerFbEventSDK
  );

module.exports = router;
