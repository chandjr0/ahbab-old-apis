const router = require("express").Router();
const { celebrate } = require("celebrate");

const employeeController = require("../../controllers/user/employeeController");
const adminValidation = require("../../validators/adminValidation");
const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router
  .route("/create")
  .post(
    [celebrate(adminValidation.employeeCreate), verifyToken, permission("admin", "employee")],
    employeeController.employeeCreate
  );

router
  .route("/update/:employeeId")
  .patch(
    [celebrate(adminValidation.employeeUpdate), verifyToken, permission("admin", "employee")],
    employeeController.employeeUpdate
  );

router.route("/single/:employeeId").get([], employeeController.singleEmployee);

router
  .route("/fetch-all")
  .get([verifyToken, permission("admin", "employee")], employeeController.allEmployeeList);

router
  .route("/delete/:employeeId")
  .delete(verifyToken, permission("admin", "employee"), employeeController.employeeDelete);

router
  .route("/activate-deactivate/:employeeId") // ?isDisabled = true/ false
  .patch(
    [verifyToken, permission("admin", "employee")],
    employeeController.employeeActivateDeactivate
  );

router
  .route("/role-permission-assign")
  .patch(
    [verifyToken, permission("admin", "employee")],
    employeeController.associateMenuToEmployee
  );

module.exports = router;
