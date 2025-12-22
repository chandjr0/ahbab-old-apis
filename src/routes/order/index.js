const express = require("express");

const router = express.Router();

const adminOrderRoute = require("./adminOrder");
const resellerOrderRoute = require("./resellerOrder");
const customerOrderRoute = require("./customerOrder");
const resellerCustomerOrderRoute = require("./resellerCustomerOrder");

router.use("/admin", adminOrderRoute);

router.use("/customer", customerOrderRoute);

router.use("/reseller-customer", resellerCustomerOrderRoute);

router.use("/reseller", resellerOrderRoute);

module.exports = router;
