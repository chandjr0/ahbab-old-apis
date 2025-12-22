const router = require("express").Router();
const { celebrate } = require("celebrate");

const resellerController = require("../../controllers/user/resellerController");
const resellerValidation = require("../../validators/reseller");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

/* --------- Visitor ------------ */
router
  .route("/submit-by-visitor")
  .post(
    [celebrate(resellerValidation.submitResellerFromByVisitor)],
    resellerController.submitResellerFromByVisitor
  );

/* --------- Admin ------------ */
router
  .route("/add")
  .post(
    [verifyToken, permission("admin", "employee"), celebrate(resellerValidation.addNewReseller)],
    resellerController.addNewReseller
  );

router
  .route("/update/:resellerId")
  .post(
    [verifyToken, permission("admin", "employee"), celebrate(resellerValidation.updateReseller)],
    resellerController.updateReseller
  );

router
  .route("/list")
  .post(
    [verifyToken, permission("admin", "employee"), celebrate(resellerValidation.listOfReseller)],
    resellerController.listOfReseller
  );

router
  .route("/search")
  .post(
    [verifyToken, permission("admin", "employee"), celebrate(resellerValidation.searchReseller)],
    resellerController.searchReseller
  );

router
  .route("/view/:serialId")
  .get([verifyToken, permission("admin", "employee")], resellerController.viewReseller);

router
  .route("/update-status/:resellerId")
  .patch(
    [
      verifyToken,
      permission("admin", "employee"),
      celebrate(resellerValidation.updateResellerStatus),
    ],
    resellerController.updateResellerStatus
  );

/* --------- Profile ------------ */
router
  .route("/login")
  .post([celebrate(resellerValidation.loginReseller)], resellerController.loginReseller);

router
  .route("/profile-view")
  .get(
    [verifyToken, permission("reseller", "reseller_emp")],
    resellerController.viewResellerProfile
  );

router
  .route("/update-payment")
  .patch(
    [
      celebrate(resellerValidation.updatePaymentDetails),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    resellerController.updatePaymentDetails
  );

router.post(
  "/forget-password",
  [celebrate(resellerValidation.otpForResetRequest)],
  resellerController.otpForResetRequest
);

router.post(
  "/verify-reset-otp",
  [celebrate(resellerValidation.verifyOtpForResetPassword)],
  resellerController.verifyOtpForResetPassword
);

router.post(
  "/reset-password",
  [celebrate(resellerValidation.resetPassword)],
  resellerController.resetPassword
);

router
  .route("/password-update")
  .post(
    [
      celebrate(resellerValidation.updatePassword),
      verifyToken,
      permission("reseller", "reseller_emp"),
    ],
    resellerController.resellerUpdatePassword
  );

module.exports = router;
