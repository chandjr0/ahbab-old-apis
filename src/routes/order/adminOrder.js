const router = require("express").Router();
const { celebrate } = require("celebrate");
const orderController = require("../../controllers/order/orderController");
const orderValidation = require("../../validators/orderValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const { removeHomeCache } = require("../../redis/homeCache");

router.route("/test").get(orderController.test);

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
  .route("/update-order/:serialId")
  .patch(
    [verifyToken, permission("admin", "employee"), removeHomeCache],
    orderController.UpdateOrder
  );

router
  .route("/single-order-for-update/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.fetchOrderForUpdate);

router
  .route("/all-order-by-admin") // page=1&limit=10
  .post(
    [celebrate(orderValidation.fetchAllOrder), verifyToken, permission("admin", "employee")],
    orderController.fetchAllOrderByAdmin
  );

router.route("/single-order/:serialId").get(
  // [celebrate(orderValidation.serialId), verifyToken, permission("admin", "employee", "customer")],
  orderController.fetchSingleOrder
);

router
  .route("/multiple-orders")
  .post(
    [celebrate(orderValidation.fetchMultipleOrder), verifyToken, permission("admin", "employee")],
    orderController.fetchMultipleOrder
  );

router
  .route("/search-order") // ?type= PHONE, SERIALID
  .post(
    [celebrate(orderValidation.searchOrder), verifyToken, permission("admin", "employee")],
    orderController.searchOrder
  );

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
  .route("/update-courier/:orderId")
  .patch(
    [celebrate(orderValidation.updateCourier), verifyToken, permission("admin", "employee")],
    orderController.updateCourier
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

module.exports = router;
