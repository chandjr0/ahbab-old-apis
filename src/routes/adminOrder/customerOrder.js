const router = require("express").Router();
const { celebrate } = require("celebrate");

const orderController = require("../../controllers/adminOrder/customerOrderController");
const orderValidation = require("../../validators/adminOrderValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const verifyTokenOrAvoid = require("../../middlewares/verifyTokenOrAvoid");
const { removeHomeCache } = require("../../redis/homeCache");

const { customerOrderLimiter } = require("../../config/rateLimit");

// ================ ADMIN CUSTOMER ORDER ==============

router
  .route("/otp-send")
  .post(
    [
      customerOrderLimiter,
      celebrate(orderValidation.orderOtpSend),
      verifyTokenOrAvoid,
      permission("customer", "visitor"),
      removeHomeCache,
    ],
    orderController.orderOtpSend
  );

  router
  .route("/otp-verify")
  .post(
    [
      customerOrderLimiter,
      celebrate(orderValidation.orderOtpVerify),
      verifyTokenOrAvoid,
      permission("customer", "visitor"),
      removeHomeCache,
    ],
    orderController.orderOtpVerify
  );

router
  .route("/create")
  .post(
    [
      customerOrderLimiter,
      celebrate(orderValidation.customerOrder),
      verifyTokenOrAvoid,
      permission("customer", "visitor"),
      removeHomeCache,
    ],
    orderController.createAdminCustomerOrder
  );

  router
  .route("/create-bkash")
  .post(
    [
      customerOrderLimiter,
      celebrate(orderValidation.customerOrder),
      verifyTokenOrAvoid,
      permission("customer", "visitor"),
      removeHomeCache,
    ],
    orderController.createAdminCustomerOrderBkash
  );

  router
  .route("/create-bkash-callback")
  .get(
    orderController.createAdminCustomerOrderBkashCallback
  );

  router
  .route("/create-incomplete")
  .post(
    [
      celebrate(orderValidation.customerIncompleteOrder),
    ],
    orderController.createAdminCustomerIncompleteOrder
  );

router
  .route("/list")
  .get(
    [customerOrderLimiter, verifyToken, permission("customer")],
    orderController.fetchAllAdminCustomerOrder
  );

router
  .route("/single-order/:serialId")
  .get([customerOrderLimiter], orderController.fetchSingleOrder);

router
  .route("/visitor-orders/:value")
  .get([customerOrderLimiter], orderController.fetchVisitorOrders);

module.exports = router;
