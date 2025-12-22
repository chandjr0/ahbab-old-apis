const router = require("express").Router();
const { celebrate } = require("celebrate");

const bkashController = require("../../controllers/onlinePayment/bkash");
const validation = require("../../validators/onlinePayment");
const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router
    .route("/bkash-create")
    .post([
        verifyToken,
        permission("admin", "employee"),
        celebrate(validation.bkashCreate)
    ],
    bkashController.createBkash
);

router
    .route("/bkash-view")
    .get([verifyToken, permission("admin", "employee")], bkashController.getBkash);

router
    .route("/bkash-active-inactive").get(bkashController.getBkashActiveOrInactive);

module.exports = router;
