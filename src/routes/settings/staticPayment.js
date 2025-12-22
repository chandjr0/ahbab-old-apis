const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const staticPaymentController = require("../../controllers/settings/staticPaymentController");
const staticPaymentValidation = require("../../validators/staticPaymentValidation");

router
  .route("/create")
  .post(
    [
      verifyToken,
      permission("admin", "employee", "reseller", "reseller_emp"),
      celebrate(staticPaymentValidation.createStaticPayment),
    ],
    staticPaymentController.createStaticPayment
  );

router
  .route("/update/:paymentId")
  .patch(
    [
      verifyToken,
      permission("admin", "employee", "reseller", "reseller_emp"),
      celebrate(staticPaymentValidation.updateStaticPayment),
    ],
    staticPaymentController.updateStaticPayment
  );

router
  .route("/delete/:paymentId")
  .delete(
    [verifyToken, permission("admin", "employee", "reseller", "reseller_emp")],
    staticPaymentController.deleteStaticPayment
  );

router
  .route("/fetch-all")
  .get(
    [verifyToken, permission("admin", "employee", "reseller", "reseller_emp")],
    staticPaymentController.fetchAllStaticPayment
  );

router
  .route("/single-fetch/:paymentId")
  .get(
    [verifyToken, permission("admin", "employee", "reseller", "reseller_emp")],
    staticPaymentController.fetchSingleStaticPayment
  );

module.exports = router;
