const router = require("express").Router();
const { celebrate } = require("celebrate");
const stockAdjustController = require("../../controllers/stockAdjust/stockAdjustController");
const returnPurchaseValidation = require("../../validators/stockAdjustValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router
  .route("/create")
  .post(
    [
      celebrate(returnPurchaseValidation.createStockAdjust),
      verifyToken,
      permission("admin", "employee"),
    ],
    stockAdjustController.createStockAdjust
  );

router
  .route("/fetch-all")
  .post(
    [
      celebrate(returnPurchaseValidation.fetchAllStockAdjust),
      verifyToken,
      permission("admin", "employee"),
    ],
    stockAdjustController.fetchAllStockAdjust
  );

router
  .route("/view/:serialId")
  .get(
    [verifyToken, permission("admin", "employee")],
    stockAdjustController.fetchSingleStockAdjust
  );

module.exports = router;
