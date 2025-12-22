const express = require("express");

const router = express.Router();

const adminCustomerRoute = require("./adminCustomer");
const resellerCustomerRoute = require("./resellerCustomer");
const { signInLimiter } = require("../../../config/rateLimit");

router.use("/admin", signInLimiter, adminCustomerRoute);

router.use("/reseller", signInLimiter, resellerCustomerRoute);

module.exports = router;
