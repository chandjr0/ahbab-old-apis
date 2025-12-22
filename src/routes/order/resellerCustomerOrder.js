const router = require("express").Router();
const { celebrate } = require("celebrate");

const orderController = require("../../controllers/order/customerOrderController");
const orderValidation = require("../../validators/orderValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const verifyTokenOrAvoid = require("../../middlewares/verifyTokenOrAvoid");
const { removeHomeCache } = require("../../redis/homeCache");
const verifyReseller = require("../../middlewares/verifyReseller");
const allowReseller = require("../../middlewares/allowReseller");

// ================ ADMIN CUSTOMER ORDER ==============
router
  .route("/create")
  .post(
    [
      verifyReseller,
      allowReseller("active"),
      celebrate(orderValidation.customerOrder),
      verifyTokenOrAvoid,
      permission("customer", "visitor"),
      removeHomeCache,
    ],
    orderController.createResellerCustomerOrder
  );

router
  .route("/list/:customerId")
  .get(
    [
      verifyReseller,
      allowReseller("active"),
      celebrate(orderValidation.customerId),
      verifyToken,
      permission("customer"),
    ],
    orderController.fetchAllResellerCustomerOrder
  );

router.route("/single-order/:serialId").get(orderController.fetchSingleOrder);

module.exports = router;
