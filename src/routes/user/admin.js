const router = require("express").Router();
const { celebrate } = require("celebrate");

const adminController = require("../../controllers/user/adminController");
const adminValidation = require("../../validators/adminValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router.route("/create").post([celebrate(adminValidation.createAdmin)], adminController.createAdmin);

router.route("/signin").post([celebrate(adminValidation.signIn)], adminController.signIn);

router
  .route("/password-update")
  .post(
    [celebrate(adminValidation.updatePassword), verifyToken, permission("admin", "employee")],
    adminController.adminUpdatePassword
  );

router.post(
  "/forget-password",
  [celebrate(adminValidation.otpForResetRequest)],
  adminController.otpForResetRequest
);

router.post(
  "/verify-reset-otp",
  [celebrate(adminValidation.verifyOtpForResetPassword)],
  adminController.verifyOtpForResetPassword
);

router.post(
  "/reset-password",
  [celebrate(adminValidation.resetPassword)],
  adminController.resetPassword
);

module.exports = router;
