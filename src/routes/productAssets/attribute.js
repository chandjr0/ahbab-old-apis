const router = require("express").Router();
const { celebrate } = require("celebrate");
const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const attributeController = require("../../controllers/productAssets/attributeController");
const attributeValidation = require("../../validators/attributeValidation");

router
  .route("/create")
  .post(
    [celebrate(attributeValidation.createAttribute), verifyToken, permission("admin", "employee")],
    attributeController.createAttribute
  );

router
  .route("/update-name/:attributeId")
  .patch(
    [celebrate(attributeValidation.updateAttribute), verifyToken, permission("admin", "employee")],
    attributeController.updateAttributeName
  );

router
  .route("/delete/:attributeId")
  .delete([verifyToken, permission("admin", "employee")], attributeController.deleteAttribute);

router
  .route("/add-option")
  .post(
    [
      celebrate(attributeValidation.createAttributeOpt),
      verifyToken,
      permission("admin", "employee"),
    ],
    attributeController.addAttributeOption
  );

router
  .route("/update-option/:attributeOptId")
  .patch(
    [
      celebrate(attributeValidation.updateAttributeOpt),
      verifyToken,
      permission("admin", "employee"),
    ],
    attributeController.updateAttributeOption
  );

router
  .route("/delete-option/:attributeOptId")
  .delete(
    [verifyToken, permission("admin", "employee")],
    attributeController.deleteAttributeOption
  );

router
  .route("/fetch-single-option/:attributeOptId")
  .get([verifyToken, permission("admin", "employee")], attributeController.fetchSingleAttributeOpt);

router
  .route("/fetch-all")
  .get([verifyToken, permission("admin", "employee")], attributeController.fetchAllAttributes);

router
  .route("/single-fetch/:attributeId")
  .get([verifyToken, permission("admin", "employee")], attributeController.fetchSingleAttribute);

module.exports = router;
