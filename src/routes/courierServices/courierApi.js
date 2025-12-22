const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

const courierServiceController = require("../../controllers/courierServices/courierApiController");
const courierServiceValidation = require("../../validators/courierServiceValidation");

router
  .route("/update")
  .patch(
    [
      celebrate(courierServiceValidation.courierServiceUpdate),
      verifyToken,
      permission("admin", "employee"),
    ],
    courierServiceController.courierServiceUpdate
  );

router
  .route("/fetch")
  .get([verifyToken, permission("admin", "employee")], courierServiceController.courierView);

module.exports = router;
