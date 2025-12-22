const router = require("express").Router();
const { celebrate } = require("celebrate");

const orderController = require("../../controllers/resellerOrder/customerOrderController");
const orderValidation = require("../../validators/resellerOrderValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const verifyTokenOrAvoid = require("../../middlewares/verifyTokenOrAvoid");
const verifyReseller = require("../../middlewares/verifyReseller");
const allowReseller = require("../../middlewares/allowReseller");
const { removeHomeCache } = require("../../redis/homeCache");
const { customerOrderLimiter } = require("../../config/rateLimit");

// ================ ADMIN CUSTOMER ORDER ==============
router
  .route("/create")
  .post(
    [
      customerOrderLimiter,
      verifyReseller,
      allowReseller("active"),
      verifyTokenOrAvoid,
      permission("customer", "visitor"),
      celebrate(orderValidation.customerOrder),
      removeHomeCache,
    ],
    orderController.createCustomerOrder
  );

router
  .route("/list")
  .get(
    [customerOrderLimiter, verifyToken, permission("customer")],
    orderController.fetchAllCustomerOrder
  );

router
  .route("/single-order/:serialId")
  .get([customerOrderLimiter], orderController.fetchSingleOrder);

router
  .route("/visitor-orders/:value")
  .get(
    [customerOrderLimiter, verifyReseller, allowReseller("active")],
    orderController.fetchVisitorOrders
  );

module.exports = router;
