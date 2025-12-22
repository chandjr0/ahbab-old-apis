const router = require("express").Router();
const { celebrate } = require("celebrate");
const resellerPaymentController = require("../../controllers/resellerPayment/resellerPayment");
const resellerPayValidation = require("../../validators/resellerPayValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

// -========= admin ========== -
router
  .route("/admin/pending-resellers")
  .post(
    [
      celebrate(resellerPayValidation.pendingResellerPaymentList),
      verifyToken,
      permission("admin", "employee"),
    ],
    resellerPaymentController.pendingResellerPaymentList
  );

router
  .route("/admin/pending-resellers-orders/:resellerId")
  .get(resellerPaymentController.pendingResellerOrders);

// this is main
router
  .route("/admin/pending-reseller-orders")
  .post(
    [
      celebrate(resellerPayValidation.pendingOrderOfReseller),
      verifyToken,
      permission("admin", "employee"),
    ],
    resellerPaymentController.pendingOrderOfReseller
  );

router
  .route("/admin/make-pey-invoice/:resellerId")
  .post(
    [
      celebrate(resellerPayValidation.makePaymentInvoice),
      verifyToken,
      permission("admin", "employee"),
    ],
    resellerPaymentController.makePaymentInvoice
  );

router
  .route("/admin/invoice-list")
  .post(
    [
      celebrate(resellerPayValidation.resellerInvoiceList),
      verifyToken,
      permission("admin", "employee"),
    ],
    resellerPaymentController.resellerInvoiceList
  );

router
  .route("/admin/invoice-view/:serialId")
  .post(
    [verifyToken, permission("admin", "employee")],
    resellerPaymentController.resellerInvoiceView
  );

router
  .route("/admin/update-invoice-status/:invoiceId")
  .post(
    [
      celebrate(resellerPayValidation.updateResellerInvoiceStatus),
      verifyToken,
      permission("admin", "employee"),
    ],
    resellerPaymentController.updateResellerInvoiceStatus
  );

// -========= admin ========== -

router
  .route("/reseller/invoice-list")
  .post(
    [
      celebrate(resellerPayValidation.resellerInvoiceList),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    resellerPaymentController.resellerInvoiceListByReseller
  );

router
  .route("/reseller/invoice-view/:serialId")
  .post(
    [verifyToken, permission("reseller", "reseller_emp")],
    resellerPaymentController.resellerInvoiceViewByReseller
  );

module.exports = router;
