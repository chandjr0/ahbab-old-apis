const express = require("express");

const router = express.Router();

const adminOrderRoute = require("./settings");
const resellerAdminOrderRoute = require("./resellerSettings");
const staticPaymentRoute = require("./staticPayment");
const showroomRoute = require("./showroom");

router.use("/admin", adminOrderRoute);

router.use("/reseller", resellerAdminOrderRoute);

router.use("/payment", staticPaymentRoute);

router.use("/showroom", showroomRoute);

module.exports = router;
