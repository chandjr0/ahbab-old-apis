const router = require("express").Router();
const { celebrate } = require("celebrate");
const settingsController = require("../../controllers/settings/resellerSettingsController");
const settingsValidation = require("../../validators/settingsValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const verifyReseller = require("../../middlewares/verifyReseller");
const allowReseller = require("../../middlewares/allowReseller");
const { removeHomeCache } = require("../../redis/homeCache");
const { customerSettingsLimiter } = require("../../config/rateLimit");

router
  .route("/view")
  .get([verifyToken, permission("reseller", "reseller_emp")], settingsController.fetchSetting);

router
  .route("/update-basic")
  .patch(
    [
      celebrate(settingsValidation.updateBasicSettingReseller),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.updateBasicSetting
  );

router
  .route("/pages-view")
  .get(
    [customerSettingsLimiter, verifyToken, permission("reseller", "reseller_emp")],
    settingsController.fetchSettingPages
  );

router
  .route("/update-pages")
  .patch(
    [
      celebrate(settingsValidation.updatePagesSetting),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.updatePagesSetting
  );

router
  .route("/upload-slider-image")
  .patch(
    [
      celebrate(settingsValidation.uploadSliderImage),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.uploadSliderImage
  );

router
  .route("/delete-slider-image")
  .post(
    [verifyToken, permission("reseller", "reseller_emp"), removeHomeCache],
    settingsController.deleteSliderImage
  );

router
  .route("/upload-brand-image")
  .patch(
    [
      celebrate(settingsValidation.uploadSliderImage),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.uploadBrandImage
  );

router
  .route("/delete-brand-image")
  .post(
    [verifyToken, permission("reseller", "reseller_emp"), removeHomeCache],
    settingsController.deleteBrandImage
  );

router
  .route("/update-popup")
  .patch(
    [
      celebrate(settingsValidation.updatePopUp),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.updatePopUp
  );

router
  .route("/update-banner-text")
  .patch(
    [
      celebrate(settingsValidation.updateBannerText),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.updateBannerText
  );

router
  .route("/update-offer-banner-img")
  .patch(
    [
      celebrate(settingsValidation.updateOfferBanner),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.updateOfferBanner
  );

router
  .route("/update-feature-banner-img")
  .patch(
    [
      celebrate(settingsValidation.updateFeatureBanner),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.updateFeatureBanner
  );

router
  .route("/fetch-fb-script")
  .get([verifyToken, permission("reseller", "reseller_emp")], settingsController.fetchFbScript);

router
  .route("/update-fb-script")
  .patch(
    [
      celebrate(settingsValidation.updateFbScript),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.updateFbScript
  );

router
  .route("/fetch-google-script")
  .get([verifyToken, permission("reseller", "reseller_emp")], settingsController.fetchGoogleScript);

router
  .route("/update-google-script")
  .patch(
    [
      celebrate(settingsValidation.updateGoogleScript),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.updateGoogleScript
  );

router
  .route("/fetch-other-script")
  .get([verifyToken, permission("reseller", "reseller_emp")], settingsController.fetchOtherScript);

router
  .route("/update-other-script")
  .patch(
    [
      celebrate(settingsValidation.updateOtherScript),
      verifyToken,
      permission("reseller", "reseller_emp"),
      removeHomeCache,
    ],
    settingsController.updateOtherScript
  );

// -========= customer
router
  .route("/site-view")
  .get(
    [customerSettingsLimiter, verifyReseller, allowReseller("active")],
    settingsController.viewSettingsByCustomer
  );

module.exports = router;
