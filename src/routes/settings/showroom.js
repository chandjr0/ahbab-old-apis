const router = require("express").Router();

const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

const showroomController = require("../../controllers/settings/showroomController");
const settingsValidation = require("../../validators/settingsValidation");

router
  .route("/create")
  .post(
    [celebrate(settingsValidation.showroomCreate), verifyToken, permission("admin", "employee")],
    showroomController.showroomCreate
  );

router
  .route("/update/:showroomId")
  .patch([verifyToken, permission("admin", "employee")], showroomController.showroomUpdate);

router.route("/view-all").get(showroomController.showroomViewAll);

router
  .route("/view/:showroomId")
  .get([verifyToken, permission("admin", "employee")], showroomController.showroomView);

router
  .route("/delete/:showroomId")
  .delete([verifyToken, permission("admin", "employee")], showroomController.showroomDelete);

module.exports = router;
