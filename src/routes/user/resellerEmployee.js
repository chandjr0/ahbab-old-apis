const router = require("express").Router();
const { celebrate } = require("celebrate");

const employeeController = require("../../controllers/user/resellerEmployeeController");
const adminValidation = require("../../validators/reseller");
const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router
  .route("/create")
  .post(
    [
      celebrate(adminValidation.employeeCreate),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    employeeController.employeeCreate
  );

router
  .route("/update/:employeeId")
  .patch(
    [
      celebrate(adminValidation.employeeUpdate),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    employeeController.employeeUpdate
  );

router.route("/single/:employeeId").get([], employeeController.singleEmployee);

router
  .route("/fetch-all")
  .get([verifyToken, permission("reseller", "reseller_emp")], employeeController.allEmployeeList);

router
  .route("/delete/:employeeId")
  .delete(verifyToken, permission("reseller", "reseller_emp"), employeeController.employeeDelete);

router
  .route("/activate-deactivate/:employeeId") // ?isDisabled = true/ false
  .patch(
    [verifyToken, permission("reseller", "reseller_emp")],
    employeeController.employeeActivateDeactivate
  );

router
  .route("/role-permission-assign")
  .patch(
    [verifyToken, permission("reseller", "reseller_emp")],
    employeeController.associateMenuToEmployee
  );

module.exports = router;
