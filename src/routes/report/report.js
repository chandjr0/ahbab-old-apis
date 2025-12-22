const router = require("express").Router();

const { celebrate } = require("celebrate");

const reportController = require("../../controllers/reports/reportController");
const reportValidation = require("../../validators/reportValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router.route("/product").get(
  // [celebrate(campaignValidation.createCampaign), verifyToken, permission("admin", "employee")],
  reportController.productsReport
);

router
  .route("/account")
  .post(
    [
      celebrate(reportValidation.accountReportByDateRange),
      verifyToken,
      permission("admin", "employee"),
    ],
    reportController.accountReportByDateRange
  );

router.route("/convert").get(reportController.htmlToPdfOfProductReport);

module.exports = router;
