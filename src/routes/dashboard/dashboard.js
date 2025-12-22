const router = require("express").Router();
const { celebrate } = require("celebrate");

const dashboardController = require("../../controllers/dashboard/dashboard");
const dashboardValidation = require("../../validators/dashboardValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router
  .route("/admin/admin-order-history")
  .post(
    [
      celebrate(dashboardValidation.dashboardOrderHistory),
      verifyToken,
      permission("admin", "employee"),
    ],
    dashboardController.adminOrderHistoryByAdmin
  );

router
  .route("/admin/reseller-order-history")
  .post(
    [
      celebrate(dashboardValidation.resellerOrderHistoryByAdmin),
      verifyToken,
      permission("admin", "employee"),
    ],
    dashboardController.resellerOrderHistoryByAdmin
  );

router
  .route("/admin/reseller-order-history/:resellerId")
  .post(
    [
      celebrate(dashboardValidation.dashboardOrderHistory),
      verifyToken,
      permission("admin", "employee"),
    ],
    dashboardController.singleResellerOrderHistoryByAdmin
  );

router
  .route("/reseller/reseller-order-history")
  .post(
    [
      celebrate(dashboardValidation.dashboardOrderHistory),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    dashboardController.resellerOrderHistoryByReseller
  );

router
  .route("/admin/top-reseller")
  .post(
    [
      celebrate(dashboardValidation.topResellersByAdmin),
      verifyToken,
      permission("admin", "employee", "reseller", "reseller_emp"),
    ],
    dashboardController.topResellersByAdmin
  );

router
  .route("/admin/top-products")
  .post(
    [
      celebrate(dashboardValidation.topProductsByAdmin),
      verifyToken,
      permission("admin", "employee", "reseller", "reseller_emp"),
    ],
    dashboardController.topProductsByAdmin
  );

router
  .route("/reseller/top-products")
  .post(
    [
      celebrate(dashboardValidation.topProductsByAdmin),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    dashboardController.topProductsByReseller
  );

router
  .route("/top-products/all-order")
  .post(
    [
      celebrate(dashboardValidation.topProductsFromAllOrder),
      verifyToken,
      permission("admin", "employee", "reseller", "reseller_emp"),
    ],
    dashboardController.topProductsFromAllOrder
  );

router
  .route("/top-products/reseller-order")
  .post(
    [
      celebrate(dashboardValidation.topProductsFromResellerOrder),
      verifyToken,
      permission("admin", "employee", "reseller", "reseller_emp"),
    ],
    dashboardController.topProductsFromResellerOrder
  );

router
  .route("/district-report")
  .post(
    [
      celebrate(dashboardValidation.districtBaseOrder),
      verifyToken,
      permission("admin", "employee", "reseller", "reseller_emp"),
    ],
    dashboardController.districtBaseOrder
  );

router
  .route("/test")
  .post([celebrate(dashboardValidation.topProductsByAdmin)], dashboardController.test);

module.exports = router;
