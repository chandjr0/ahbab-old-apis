const router = require("express").Router();
const { celebrate } = require("celebrate");
const orderController = require("../../controllers/resellerOrder/resellerAdminOrderController");
const orderValidation = require("../../validators/resellerOrderValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const { removeHomeCache } = require("../../redis/homeCache");

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
  .route("/single-order-for-update/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.fetchOrderForUpdate);

router
  .route("/update-order/:serialId")
  .patch(
    [
      celebrate(orderValidation.UpdateOrderByAdmin),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    orderController.UpdateOrder
  );

router
  .route("/all-order-by-admin") // page=1&limit=10
  .post(
    [celebrate(orderValidation.fetchAllOrderByAdmin), verifyToken, permission("admin", "employee")],
    orderController.fetchAllOrderByAdmin
  );

router
  .route("/search-order")
  .post(
    [celebrate(orderValidation.searchOrderByAdmin), verifyToken, permission("admin", "employee")],
    orderController.searchOrderByAdmin
  );

router
  .route("/single-order/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.fetchSingleOrderByAdmin);

router
  .route("/multiple-orders")
  .post(
    [
      celebrate(orderValidation.fetchMultipleOrderByAdmin),
      verifyToken,
      permission("admin", "employee"),
    ],
    orderController.fetchMultipleOrderByAdmin
  );

//= ========== update options ===========

router
  .route("/update-order-status/:orderId") // ?status= CANCEL, CONFIRM, PROCESSING, PICKED, SHIPPED, DELIVERED
  .patch(
    [
      celebrate(orderValidation.updateOrderStatusByAdmin),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    orderController.updateOrderStatusByAdmin
  );

router
  .route("/order-status-update-shipping")
  .put(
    [
      celebrate(orderValidation.updateOrderStatusReadyToShip_TO_Shipping),
      verifyToken,
      permission("admin", "employee")
    ],
    orderController.adminUpdateResellerOrderStatusReadyToShip_TO_Shipping
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
      celebrate(orderValidation.updateOrderPaymentInfoByAdmin),
      verifyToken,
      permission("admin", "employee"),
    ],
    orderController.updateOrderPaymentInfoByAdmin
  );

router
  .route("/update-address/:orderId")
  .patch(
    [
      celebrate(orderValidation.updateOrderCustomerAddressByAdmin),
      verifyToken,
      permission("admin", "employee"),
    ],
    orderController.updateOrderCustomerAddressByAdmin
  );

router
  .route("/add-order-note/:orderId")
  .patch(
    [celebrate(orderValidation.addAdminNoteByAdmin), verifyToken, permission("admin", "employee")],
    orderController.addAdminNoteByAdmin
  );

router
  .route("/update-customer-note/:orderId")
  .patch(
    [
      celebrate(orderValidation.updateCustomerNoteByAdmin),
      verifyToken,
      permission("admin", "employee"),
    ],
    orderController.updateCustomerNoteByAdmin
  );

router
  .route("/update-courier/:orderId")
  .patch(
    [celebrate(orderValidation.updateCourierByAdmin), verifyToken, permission("admin", "employee")],
    orderController.updateCourierByAdmin
  );

// ================== maker order paid ======================
router
  .route("/search-for-paid/:serialId")
  .get([verifyToken, permission("admin", "employee")], orderController.searchDeliveryOrder);

router
  .route("/update-order-paid")
  .post([verifyToken, permission("admin", "employee")], orderController.makeDeliveryOrderPaid);

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
