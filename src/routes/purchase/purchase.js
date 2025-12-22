const router = require("express").Router();
const { celebrate } = require("celebrate");
const purchaseController = require("../../controllers/purchase/purchaseController");
const purchaseValidation = require("../../validators/purchaseValidation");
// const shareValidation = require("../../validators/shareValidation");

// const checkPagination = celebrate(shareValidation.pageValidaiton);

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const { removeHomeCache } = require("../../redis/homeCache");

router
  .route("/create")
  .post(
    [celebrate(purchaseValidation.createPurchase), verifyToken, permission("admin", "employee")],
    purchaseController.createPurchase
  );

router
  .route("/update/:purchaseId")
  .patch([verifyToken, permission("admin", "employee")], purchaseController.updatePurchase);

router
  .route("/fetch-all")
  .get(
    [celebrate(purchaseValidation.fetchAllPurchase), verifyToken, permission("admin", "employee")],
    purchaseController.fetchAllPurchase
  );

router
  .route("/fetch-single/:serialId")
  .get(
    [
      celebrate(purchaseValidation.fetchSinglePurchase),
      verifyToken,
      permission("admin", "employee"),
    ],
    purchaseController.fetchSinglePurchase
  );

router
  .route("/delete/:purchaseId")
  .delete(
    [celebrate(purchaseValidation.deletePurchase), verifyToken, permission("admin", "employee")],
    purchaseController.deletePurchase
  );

router
  .route("/update-status")
  .patch(
    [
      celebrate(purchaseValidation.updatePurchaseStatus),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    purchaseController.updatePurchaseStatus
  );

router
  .route("/add-purchase-note/:purchaseId")
  .patch(
    [celebrate(purchaseValidation.addAdminNote), verifyToken, permission("admin", "employee")],
    purchaseController.addAdminNote
  );

router
  .route("/search-purchase")
  .post(
    [celebrate(purchaseValidation.searchPurchase), verifyToken, permission("admin", "employee")],
    purchaseController.searchPurchase
  );

router.route("/test").get([verifyToken, permission("admin", "employee")], purchaseController.test);

module.exports = router;
