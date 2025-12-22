const router = require("express").Router();
const { celebrate } = require("celebrate");

const pathaoToken = require("../../middlewares/courierService/pathaoToken");
const verifyToken = require("../../middlewares/verifyToken");
const verifyWebSecret = require("../../middlewares/courierService/verifyWebSecret");
const permission = require("../../middlewares/permission");

const pathaoServiceController = require("../../controllers/courierServices/pathaoServieceController");
const courierServiceValidation = require("../../validators/courierServiceValidation");

//= ==============   CRUD START ====================
router.route("/update-pathaw").get([pathaoToken], pathaoServiceController.updateAllPathaoInfo);

router.route("/get-areas").get(
  // [pathaoToken],
  pathaoServiceController.getCities
);

router.route("/get-zones/:cityId").get(
  // [pathaoToken],
  pathaoServiceController.getZones
);

router.route("/get-areas/:zoneId").get([pathaoToken], pathaoServiceController.getAreas);

router.route("/get-stores").get([pathaoToken], pathaoServiceController.getStores);

router
  .route("/create-parcel")
  .post(
    [
      celebrate(courierServiceValidation.createPathaoParcel),
      verifyToken,
      permission("admin", "employee"),
      pathaoToken,
    ],
    pathaoServiceController.createPathaoParcel
  );

router
  .route("/create-bulk-parcel")
  .post(
    [
      celebrate(courierServiceValidation.createPathaoBulkParcel),
      verifyToken,
      permission("admin", "employee"),
      pathaoToken,
    ],
    pathaoServiceController.createPathaoBulkParcel
  );

router
  .route("/update-status")
  .post([pathaoToken, verifyWebSecret], pathaoServiceController.updateStatusByWebhook);

router
  .route("/view/:courierTrackId")
  .get(
    [verifyToken, permission("admin", "employee", "reseller")],
    pathaoServiceController.viewCourierDetails
  );

module.exports = router;
