const router = require("express").Router();
const { celebrate } = require("celebrate");

const locationController = require("../../controllers/location/locationController");
const locationValidation = require("../../validators/locationValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router.route("/divisions").get(locationController.getAllDivisions);

router.route("/districts").get(locationController.getAllDistrict);

router.route("/areas").get(locationController.getAllAreas);

router.route("/district-areas/:districtId").get(locationController.getDistrictAreas);

router.route("/all").get(locationController.allLocations);

router
  .route("/area/add")
  .post(
    [celebrate(locationValidation.addArea), verifyToken, permission("admin", "employee")],
    locationController.addArea
  );

router
  .route("/area/remove/:areaId")
  .delete(
    [celebrate(locationValidation.removeArea), verifyToken, permission("admin", "employee")],
    locationController.removeArea
  );

module.exports = router;
