const router = require("express").Router();
// const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

const stickerController = require("../../controllers/productAssets/stickerController");

router
  .route("/create")
  .post([verifyToken, permission("admin", "employee")], stickerController.stickerCreate);

router
  .route("/update/:stickerId")
  .patch([verifyToken, permission("admin", "employee")], stickerController.stickerUpdate);

router
  .route("/fetch-all")
  .get([verifyToken, permission("admin", "employee")], stickerController.stickerViewAll);

router
  .route("/delete/:stickerId")
  .delete([verifyToken, permission("admin", "employee")], stickerController.stickerDelete);

module.exports = router;
