const router = require("express").Router();
const { celebrate } = require("celebrate");
const orderController = require("../../controllers/adminOrder/adminOrderController");
const orderValidation = require("../../validators/adminOrderValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const { removeHomeCache } = require("../../redis/homeCache");

router
  .route("/create-pos-order")
  .post(
    [
      celebrate(orderValidation.posOrder),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    orderController.createPosOrder
  );

router
  .route("/single-order-for-update/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.fetchOrderForUpdate);

router
  .route("/update-order/:serialId")
  .patch(
    [celebrate(orderValidation.UpdateOrder), verifyToken, permission("admin", "employee")],
    orderController.UpdateOrder
  );

router
  .route("/fetch-all-customer-order/:customerId")
  .get(
    [
      celebrate(orderValidation.fetchCustomerAllOrder),
      verifyToken,
      permission("admin", "employee"),
    ],
    orderController.fetchCustomerAllOrder
  );

router
  .route("/all-order-by-admin") // page=1&limit=10
  .post(
    [celebrate(orderValidation.fetchAllOrder), verifyToken, permission("admin", "employee")],
    orderController.fetchAllOrderByAdmin
  );

  router
  .route("/all-incomplete-order-by-admin") // page=1&limit=10
  .get(
    [celebrate(orderValidation.fetchAllIncompleteOrder), verifyToken, permission("admin", "employee")],
    orderController.fetchAllIncompleteOrderByAdmin
  );

  router
  .route("/incomplete-order-update")
  .put(
    [celebrate(orderValidation.incompleteOrderUpdate), verifyToken, permission("admin", "employee")],
    orderController.incompleteOrderUpdate
  );

router
  .route("/search-order")
  .post(
    [celebrate(orderValidation.searchOrder), verifyToken, permission("admin", "employee")],
    orderController.searchOrder
  );

  router
  .route("/search-incomplete-order")
  .post(
    [verifyToken, permission("admin", "employee")],
    orderController.searchIncompleteOrder
  );

router
  .route("/single-order/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.fetchSingleOrder);

router
  .route("/multiple-orders")
  .post(
    [celebrate(orderValidation.fetchMultipleOrder), verifyToken, permission("admin", "employee")],
    orderController.fetchMultipleOrder
  );

//= ========== update options ===========

router
  .route("/update-order-status/:orderId") // ?status= CANCEL, CONFIRM, PROCESSING, PICKED, SHIPPED, DELIVERED
  .patch(
    [
      celebrate(orderValidation.updateOrderStatus),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    orderController.updateOrderStatus
  );

  router
  .route("/order-status-update-shipping")
  .put(
    [
      celebrate(orderValidation.updateOrderStatusReadyToShip_TO_Shipping),
      verifyToken,
      permission("admin", "employee")
    ],
    orderController.updateOrderStatusReadyToShip_TO_Shipping
  );

router
  .route("/update-multiple-order-status") // ?status= CANCEL, CONFIRM, PROCESSING, PICKED, SHIPPED, DELIVERED
  .patch(
    [
      celebrate(orderValidation.updateMultipleOrderStatus),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    orderController.updateMultipleOrderStatus
  );

router
  .route("/update-payment-info/:orderId")
  .patch(
    [
      celebrate(orderValidation.updateOrderPaymentInfo),
      verifyToken,
      permission("admin", "employee"),
    ],
    orderController.updateOrderPaymentInfo
  );

router
  .route("/update-address/:orderId")
  .patch(
    [
      celebrate(orderValidation.updateOrderCustomerAddress),
      verifyToken,
      permission("admin", "employee"),
    ],
    orderController.updateOrderCustomerAddress
  );

router
  .route("/add-order-note/:orderId")
  .patch(
    [celebrate(orderValidation.addAdminNote), verifyToken, permission("admin", "employee")],
    orderController.addAdminNote
  );

router
  .route("/update-customer-note/:orderId")
  .patch(
    [celebrate(orderValidation.updateCustomerNote), verifyToken, permission("admin", "employee")],
    orderController.updateCustomerNote
  );

router
  .route("/update-courier/:orderId")
  .patch(
    [celebrate(orderValidation.updateCourier), verifyToken, permission("admin", "employee")],
    orderController.updateCourier
  );

// ----------------- invoice order
router
  .route("/search-for-invoice/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.searchOrderToInvoice);

router
  .route("/update-orders-invoice")
  .post(
    [celebrate(orderValidation.makeOrdersInvoice), verifyToken, permission("admin", "employee")],
    orderController.makeOrdersInvoice
  );

// ----------------- make delivered order
router
  .route("/search-for-deliver/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.searchOrderToDelivered);

router
  .route("/update-orders-deliver")
  .post(
    [celebrate(orderValidation.makeOrdersInvoice), verifyToken, permission("admin", "employee")],
    orderController.makeOrdersDelivered
  );

// ----------------- invoice return
router
  .route("/search-for-return/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.searchOrderToReturn);

router.route("/add-return-calc").post(
  [
    // celebrate(orderValidation.makeOrdersInvoice),
    verifyToken,
    permission("admin", "employee"),
  ],
  orderController.addReturnCalculationByAdmin
);

/*
router
  .route("/update-order/:serialId")
  .patch(
    [verifyToken, permission("admin", "employee"), removeHomeCache],
    orderController.UpdateOrder
  );

router
  .route("/single-order-for-update/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.fetchOrderForUpdate);


router
  .route("/update-multiple-order-status")
  .patch(
    [
      celebrate(orderValidation.updateMultipleOrderStatus),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    orderController.updateMultipleOrderStatus
  );

router
  .route("/order-invoice/:orderId")
  .get(
    [celebrate(orderValidation.orderId), verifyToken, permission("admin", "employee")],
    orderController.orderInvoiceDownload
  );

router
  .route("/return-refund/:orderId")
  .patch(
    [
      celebrate(orderValidation.returnRefundOrder),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    orderController.returnRefundOrder
  );
*/

module.exports = router;
