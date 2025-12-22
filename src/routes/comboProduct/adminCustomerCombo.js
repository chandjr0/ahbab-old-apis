const router = require("express").Router();
const { celebrate } = require("celebrate");

const adminCustomerComboController = require("../../controllers/comboProduct/adminCustomerComboController");
const comboValidation = require("../../validators/comboValidation");

router
  .route("/list") // ?page=1&limit=1
  .get([celebrate(comboValidation.pagination)], adminCustomerComboController.listOFCombo);

router.route("/view/:comboSlug").get(adminCustomerComboController.viewCombo);

module.exports = router;
