const router = require("express").Router();

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

const courierController = require("../../controllers/courier/courierContrller");

router
  .route("/create")
  .post([verifyToken, permission("admin", "employee")], courierController.CourierCreate);

router
  .route("/update/:courierId")
  .patch([verifyToken, permission("admin", "employee")], courierController.courierUpdate);

router
  .route("/fetch-all")
  .get(
    [verifyToken, permission("admin", "employee", "reseller")],
    courierController.courierViewAll
  );

router
  .route("/delete/:courierId")
  .delete([verifyToken, permission("admin", "employee")], courierController.courierDelete);

router
  .route("/status-update")
  .patch([verifyToken, permission("admin", "employee")], courierController.courierStatusUpdate);

module.exports = router;
