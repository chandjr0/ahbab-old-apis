const router = require("express").Router();
const { celebrate } = require("celebrate");

const resellerApplicantController = require("../../controllers/user/resellerApplicantController");
const resellerValidation = require("../../validators/reseller");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

/* --------- visitor ------------ */
router
  .route("/submit")
  .post(
    [celebrate(resellerValidation.submitResellerApplication)],
    resellerApplicantController.submitResellerApplication
  );

/* --------- Admin Start ------------ */
router
  .route("/list")
  .post(
    [verifyToken, permission("admin", "employee"), celebrate(resellerValidation.listOfApplication)],
    resellerApplicantController.listOfApplication
  );

router
  .route("/view/:applicantId")
  .get([verifyToken, permission("admin", "employee")], resellerApplicantController.viewApplicant);

router
  .route("/update-status/:applicantId")
  .patch(
    [
      verifyToken,
      permission("admin", "employee"),
      celebrate(resellerValidation.updateApplicantStatus),
    ],
    resellerApplicantController.updateApplicantStatus
  );

module.exports = router;
