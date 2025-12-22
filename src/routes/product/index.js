const express = require("express");

const router = express.Router();

const adminProductRoute = require("./adminProduct");
const adminCustomerProductRoute = require("./adminCustomerProduct");
const resellerProductRoute = require("./resellerProduct");
const resellerCustomerProductRoute = require("./resellerCustomerProduct");
const { productLimiter } = require("../../config/rateLimit");

router.use("/admin", adminProductRoute);
router.use("/admin-customer", productLimiter, adminCustomerProductRoute);
router.use("/reseller", resellerProductRoute);
router.use("/reseller-customer", productLimiter, resellerCustomerProductRoute);

module.exports = router;
