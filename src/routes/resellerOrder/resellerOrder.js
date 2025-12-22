const router = require("express").Router();
const { celebrate } = require("celebrate");
const orderController = require("../../controllers/resellerOrder/resellerOrderController");
const orderValidation = require("../../validators/resellerOrderValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const { removeHomeCache } = require("../../redis/homeCache");

router
  .route("/create-pos-order")
  .post(
    [
      celebrate(orderValidation.posOrder),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    orderController.createPosOrder
  );

router
  .route("/single-order-for-update/:serialId")
  .get([verifyToken, permission("reseller", "reseller_emp")], orderController.fetchOrderForUpdate);

router
  .route("/update-order/:serialId")
  .patch(
    [
      celebrate(orderValidation.UpdateOrderByReseller),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    orderController.UpdateOrder
  );

router
  .route("/fetch-all-customer-order/:customerId")
  .get(
    [
      celebrate(orderValidation.fetchCustomerAllOrder),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    orderController.fetchCustomerAllOrder
  );

router
  .route("/pending/all-order-by-reseller") // page=1&limit=10
  .post(
    [
      celebrate(orderValidation.fetchAllPendingOrder),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    orderController.fetchAllPendingOrder
  );

router
  .route("/pending/search-order")
  .post(
    [
      celebrate(orderValidation.searchPendingOrder),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    orderController.searchPendingOrder
  );

router
  .route("/all-order-by-reseller") // page=1&limit=10
  .post(
    [celebrate(orderValidation.fetchAllOrder), verifyToken, permission("reseller", "reseller_emp")],
    orderController.fetchAllOrder
  );

router
  .route("/search-order")
  .post(
    [celebrate(orderValidation.searchOrder), verifyToken, permission("reseller", "reseller_emp")],
    orderController.searchOrder
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

//= ========== update options ===========
router
  .route("/update-order-status/:orderId") // ?status= CANCEL, CONFIRM, PROCESSING, PICKED, SHIPPED, DELIVERED
  .patch(
    [
      celebrate(orderValidation.updateOrderStatusByReseller),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    orderController.updateOrderStatusByReseller
  );

router
  .route("/update-address/:orderId")
  .patch(
    [
      celebrate(orderValidation.updateOrderCustomerAddress),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    orderController.updateOrderCustomerAddress
  );

router
  .route("/add-order-note/:orderId")
  .patch(
    [
      celebrate(orderValidation.addResellerNote),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    orderController.addResellerNote
  );

router
  .route("/update-customer-note/:orderId")
  .patch(
    [
      celebrate(orderValidation.updateCustomerNote),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    orderController.updateCustomerNote
  );

module.exports = router;
