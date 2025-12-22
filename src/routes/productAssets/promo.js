const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

const promoController = require("../../controllers/productAssets/promoController");
const promoValidation = require("../../validators/promoValidation");

router
  .route("/create")
  .post(
    [celebrate(promoValidation.create), verifyToken, permission("admin", "employee")],
    promoController.createPromo
  );

router
  .route("/update/:promoId")
  .patch(
    [celebrate(promoValidation.update), verifyToken, permission("admin", "employee")],
    promoController.updatePromo
  );

router
  .route("/enable-or-disable/:promoId") // ?isDisable=true or false
  .patch(
    [celebrate(promoValidation.enableOrDisable), verifyToken, permission("admin", "employee")],
    promoController.promoEnableDisable
  );

router
  .route("/fetch-all-promo")
  .get(
    [celebrate(promoValidation.fetchAllPromo), verifyToken, permission("admin", "employee")],
    promoController.fetchAllPromo
  );

router
  .route("/reseller/fetch-all-promo")
  .get(
    [celebrate(promoValidation.fetchAllPromo), verifyToken, permission("reseller", "reseller_emp")],
    promoController.fetchAllPromoByReseller
  );

router
  .route("/fetch-single-promo/:promoId")
  .get(
    [celebrate(promoValidation.checkPromoId), verifyToken, permission("admin", "employee")],
    promoController.fetchSinglePromo
  );

router
  .route("/delete/:promoId")
  .delete(
    [celebrate(promoValidation.checkPromoId), verifyToken, permission("admin", "employee")],
    promoController.deletePromo
  );

router
  .route("/verify-promo")
  .post([celebrate(promoValidation.verifyPromo)], promoController.verifyPromo);

module.exports = router;
