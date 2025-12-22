const express = require("express");

const router = express.Router();

const courierApiRoute = require("./courierApi");
const pathaoRoute = require("./pathao");

router.use("/api", courierApiRoute);

router.use("/pathao", pathaoRoute);

module.exports = router;
