const router = require("express").Router();
const { celebrate } = require("celebrate");
const settingsController = require("../../controllers/settings/settingsController");
const settingsValidation = require("../../validators/settingsValidation");
const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const { removeHomeCache } = require("../../redis/homeCache");
const { customerSettingsLimiter } = require("../../config/rateLimit");

router.route("/view").get(settingsController.fetchSetting);

router
  .route("/update-basic")
  .patch(
    [
      celebrate(settingsValidation.updateBasicSettingAdmin),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    settingsController.updateBasicSetting
  );

router.route("/pages-view").get([customerSettingsLimiter], settingsController.fetchSettingPages);

router
  .route("/update-pages")
  .patch(
    [
      celebrate(settingsValidation.updatePagesSetting),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    settingsController.updatePagesSetting
  );

router
  .route("/update-delivery-charge")
  .patch(
    [
      celebrate(settingsValidation.updateDeliveryCharge),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    settingsController.updateDeliveryCharge
  );

router
  .route("/upload-slider-image")
  .patch(
    [
      celebrate(settingsValidation.uploadSliderImage),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    settingsController.uploadSliderImage
  );

router
  .route("/upload-slider-image-mobile")
  .patch(
    [
      celebrate(settingsValidation.uploadSliderImageForMobile),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    settingsController.uploadSliderImageForMobile
  );

router
  .route("/delete-slider-image")
  .post(
    [verifyToken, permission("admin", "employee"), removeHomeCache],
    settingsController.deleteSliderImage
  );

router
  .route("/delete-slider-image-mobile")
  .delete(
    [verifyToken, permission("admin", "employee"), removeHomeCache],
    settingsController.deleteSliderImageForMobile
  );

router
  .route("/upload-brand-image")
  .patch(
    [
      celebrate(settingsValidation.uploadSliderImage),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    settingsController.uploadBrandImage
  );

router
  .route("/delete-brand-image")
  .post(
    [verifyToken, permission("admin", "employee"), removeHomeCache],
    settingsController.deleteBrandImage
  );

router
  .route("/update-popup")
  .patch(
    [
      celebrate(settingsValidation.updatePopUp),
      verifyToken,
      permission("admin", "employee"),
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
      permission("admin", "employee"),
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
      permission("admin", "employee"),
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
      permission("admin", "employee"),
      removeHomeCache,
    ],
    settingsController.updateFeatureBanner
  );

router.route("/fetch-fb-script").get(settingsController.fetchFbScript);

router
  .route("/update-fb-script")
  .patch(
    [
      celebrate(settingsValidation.updateFbScript),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    settingsController.updateFbScript
  );

router.route("/fetch-google-script").get(settingsController.fetchGoogleScript);

router
  .route("/update-google-script")
  .patch(
    [
      celebrate(settingsValidation.updateGoogleScript),
      verifyToken,
      permission("admin", "employee"),
      removeHomeCache,
    ],
    settingsController.updateGoogleScript
  );

router.route("/fetch-other-script").get(settingsController.fetchOtherScript);

router.route("/update-other-script").patch(
  [
    // celebrate(settingsValidation.updateOtherScript),
    verifyToken,
    permission("admin", "employee"),
    removeHomeCache,
  ],
  settingsController.updateOtherScript
);

// -========= customer
router
  .route("/site-view")
  .get([customerSettingsLimiter], settingsController.viewSettingsByCustomer);

module.exports = router;
