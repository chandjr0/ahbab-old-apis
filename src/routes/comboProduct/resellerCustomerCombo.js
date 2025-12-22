const router = require("express").Router();
const { celebrate } = require("celebrate");

const resellerCustomerComboController = require("../../controllers/comboProduct/resellerCustomerComboController");
const comboValidation = require("../../validators/comboValidation");

router
  .route("/list") // ?page=1&limit=1
  .get([celebrate(comboValidation.pagination)], resellerCustomerComboController.listOFCombo);

router.route("/view/:comboSlug").get(resellerCustomerComboController.viewCombo);

module.exports = router;
