const express = require("express");

const router = express.Router();

const adminComboRoute = require("./adminCombo");
const adminCustomerComboRoute = require("./adminCustomerCombo");
const resellerComboRoute = require("./resellerCombo");
const resellerCustomerComboRoute = require("./resellerCustomerCombo");

router.use("/admin", adminComboRoute);

router.use("/admin-customer", adminCustomerComboRoute);

router.use("/reseller", resellerComboRoute);

router.use("/reseller-customer", resellerCustomerComboRoute);

module.exports = router;
