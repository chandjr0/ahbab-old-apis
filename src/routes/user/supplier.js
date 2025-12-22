const router = require("express").Router();
const { celebrate } = require("celebrate");

const supplierController = require("../../controllers/user/supplierController");
const supplierValidation = require("../../validators/supplierValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router
  .route("/create")
  .post(
    [verifyToken, permission("admin", "employee"), celebrate(supplierValidation.createSupplier)],
    supplierController.createSupplier
  );

router
  .route("/update/:supplierId")
  .patch(
    [verifyToken, permission("admin", "employee"), celebrate(supplierValidation.updateSupplier)],
    supplierController.updateSupplier
  );

router
  .route("/delete/:supplierId")
  .delete([verifyToken, permission("admin", "employee")], supplierController.deleteSupplier);

router.route("/fetch-all").get(supplierController.fetchSuppliers);

router.route("/single-fetch/:supplierId").get(supplierController.fetchSingleSupplier);

module.exports = router;
