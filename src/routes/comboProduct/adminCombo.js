const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

const adminComboController = require("../../controllers/comboProduct/adminComboController");
const comboValidation = require("../../validators/comboValidation");

router
  .route("/create")
  .post(
    [celebrate(comboValidation.createCombo), verifyToken, permission("admin", "employee")],
    adminComboController.createCombo
  );

router
  .route("/update/:comboId")
  .patch(
    [celebrate(comboValidation.updateCombo), verifyToken, permission("admin", "employee")],
    adminComboController.updateCombo
  );

router
  .route("/delete/:comboId")
  .delete([verifyToken, permission("admin", "employee")], adminComboController.deleteCombo);

router
  .route("/list")
  .post(
    [celebrate(comboValidation.listOFCombo), verifyToken, permission("admin", "employee")],
    adminComboController.listOFCombo
  );

router
  .route("/pos-list")
  .post(
    [celebrate(comboValidation.posListOFCombo), verifyToken, permission("admin", "employee")],
    adminComboController.posListOFCombo
  );

router
  .route("/view/:comboSlug")
  .get([verifyToken, permission("admin", "employee")], adminComboController.viewCombo);

router
  .route("/featured/:comboId")
  .patch(
    [celebrate(comboValidation.featuredCombo), verifyToken, permission("admin", "employee")],
    adminComboController.featuredCombo
  );

router
  .route("/pos-suggested/:comboId")
  .patch(
    [celebrate(comboValidation.posSuggestedCombo), verifyToken, permission("admin", "employee")],
    adminComboController.posSuggestedCombo
  );

router
  .route("/disable/:comboId")
  .patch(
    [celebrate(comboValidation.disableCombo), verifyToken, permission("admin", "employee")],
    adminComboController.disableCombo
  );

router
  .route("/reseller-status/:comboId")
  .patch(
    [celebrate(comboValidation.resellerStatusCombo), verifyToken, permission("admin", "employee")],
    adminComboController.resellerStatusCombo
  );

module.exports = router;
