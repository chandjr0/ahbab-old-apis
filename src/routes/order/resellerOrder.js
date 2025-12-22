const router = require("express").Router();
const { celebrate } = require("celebrate");
const orderController = require("../../controllers/order/resellerOrderController");
const orderValidation = require("../../validators/orderValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const { removeHomeCache } = require("../../redis/homeCache");

router
  .route("/create-pos-order")
  .post(
    [
      celebrate(orderValidation.createPosOrderByReseller),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    orderController.createPosOrderByReseller
  );

router
  .route("/all-order") // page=1&limit=10
  .post(
    [
      celebrate(orderValidation.fetchAllOrderReseller),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    orderController.fetchAllOrderReseller
  );

router
  .route("/single-order/:serialId")
  .get([verifyToken, permission("reseller", "reseller_emp")], orderController.fetchSingleOrder);

router
  .route("/multiple-orders")
  .post(
    [
      celebrate(orderValidation.fetchMultipleOrder),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    orderController.fetchMultipleOrder
  );

router
  .route("/search-order") // ?type= PHONE, SERIALID
  .post(
    [celebrate(orderValidation.searchOrder), verifyToken, permission("reseller", "reseller_emp")],
    orderController.searchOrder
  );

router
  .route("/order-invoice/:orderId")
  .get(
    [celebrate(orderValidation.orderId), verifyToken, permission("reseller", "reseller_emp")],
    orderController.orderInvoiceDownload
  );

module.exports = router;
