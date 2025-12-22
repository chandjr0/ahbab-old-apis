const router = require("express").Router();
const { celebrate } = require("celebrate");
const brandController = require("../../controllers/productAssets/brandController");
const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const brandValidation = require("../../validators/brandValidation");

router
  .route("/create")
  .post(
    [verifyToken, permission("admin", "employee"), celebrate(brandValidation.createBrand)],
    brandController.createBrand
  );

router
  .route("/update/:brandId")
  .patch(
    [verifyToken, permission("admin", "employee"), celebrate(brandValidation.updateBrand)],
    brandController.updateBrand
  );

router
  .route("/delete/:brandId")
  .delete([verifyToken, permission("admin", "employee")], brandController.deleteBrand);

router.route("/fetch-all").get(brandController.fetchALLBrand);

router.route("/single-fetch/:brandId").get(brandController.fetchSingleBrand);

router.route("/fetch-all-featured").get(brandController.fetchALLFeaturedBrand);

module.exports = router;
