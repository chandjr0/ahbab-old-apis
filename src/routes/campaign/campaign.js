const router = require("express").Router();

const { celebrate } = require("celebrate");

const campaignController = require("../../controllers/campaign/campaign");
const campaignValidation = require("../../validators/campaignValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

router
  .route("/create")
  .post(
    [celebrate(campaignValidation.createCampaign), verifyToken, permission("admin", "employee")],
    campaignController.createCampaign
  );

router
  .route("/update/:campaignId")
  .patch(
    [celebrate(campaignValidation.updateCampaign), verifyToken, permission("admin", "employee")],
    campaignController.updateCampaign
  );

router
  .route("/delete/:campaignId")
  .delete([verifyToken, permission("admin", "employee")], campaignController.deleteCampaign);

router
  .route("/single-fetch/:campaignId")
  .get([verifyToken, permission("admin", "employee")], campaignController.fetchSingleCampaign);

router
  .route("/fetch-all")
  .post(
    [celebrate(campaignValidation.fetchAllCampaign), verifyToken, permission("admin", "employee")],
    campaignController.fetchAllCampaign
  );

router
  .route("/single-details-fetch/:campaignId")
  .get(
    [verifyToken, permission("admin", "employee")],
    campaignController.fetchDetailsSingleCampaign
  );

router
  .route("/product-details")
  .post([verifyToken, permission("admin", "employee")], campaignController.campaignProductDetails);

router
  .route("/cost/create")
  .post(
    [celebrate(campaignValidation.addCampaignCost), verifyToken, permission("admin", "employee")],
    campaignController.addCampaignCost
  );

router
  .route("/cost/update/:campaignCostId")
  .patch(
    [
      celebrate(campaignValidation.updateCampaignCost),
      verifyToken,
      permission("admin", "employee"),
    ],
    campaignController.updateCampaignCost
  );

router
  .route("/cost/delete/:campaignCostId")
  .delete([verifyToken, permission("admin", "employee")], campaignController.deleteCampaignCost);

router
  .route("/cost/fetch-all/:campaignId")
  .get([verifyToken, permission("admin", "employee")], campaignController.fetchCampaignCost);

module.exports = router;
