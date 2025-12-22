const router = require("express").Router();
const { celebrate } = require("celebrate");

const orderController = require("../../controllers/order/customerOrderController");
const orderValidation = require("../../validators/orderValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const verifyTokenOrAvoid = require("../../middlewares/verifyTokenOrAvoid");
const { removeHomeCache } = require("../../redis/homeCache");

// ================ ADMIN CUSTOMER ORDER ==============
router
  .route("/create")
  .post(
    [
      celebrate(orderValidation.customerOrder),
      verifyTokenOrAvoid,
      permission("customer", "visitor"),
      removeHomeCache,
    ],
    orderController.createAdminCustomerOrder
  );

router
  .route("/list/:customerId")
  .get(
    [celebrate(orderValidation.customerId), verifyToken, permission("customer")],
    orderController.fetchAllAdminCustomerOrder
  );

router.route("/single-order/:serialId").get(orderController.fetchSingleOrder);

module.exports = router;
