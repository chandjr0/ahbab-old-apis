const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

const resellerComboController = require("../../controllers/comboProduct/resellerComboController");
const comboValidation = require("../../validators/comboValidation");

//= ==============   CRUD START ====================

router
  .route("/list")
  .post(
    [celebrate(comboValidation.listOFCombo), verifyToken, permission("reseller", "reseller_emp")],
    resellerComboController.listOFCombo
  );

router
  .route("/pos-list")
  .post(
    [
      celebrate(comboValidation.posListOFCombo),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    resellerComboController.posListOFCombo
  );

router
  .route("/view/:comboSlug")
  .get([verifyToken, permission("reseller", "reseller_emp")], resellerComboController.viewCombo);

module.exports = router;
