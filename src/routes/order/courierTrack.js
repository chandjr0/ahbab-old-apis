const router = require("express").Router();
const { celebrate } = require("celebrate");
const courierTrackController = require("../../controllers/order/courierTrackController");
const courierTrackValidation = require("../../validators/courierTrackValidation");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

//= ===================== REDX ===============
router.route("/redx/areas").get(
  // [celebrate(orderValidation.returnRefundOrder), verifyToken, permission("admin", "employee")],
  courierTrackController.fetchRedxAreas
);

router
  .route("/redx/create-parcel")
  .post(
    [
      celebrate(courierTrackValidation.createRedxParcel),
      verifyToken,
      permission("admin", "employee"),
    ],
    courierTrackController.createRedxParcel
  );

router.route("/redx/parcel/:courierTrackId").get(
  [
    // celebrate(orderValidation.returnRefundOrder),
    verifyToken,
    permission("admin", "employee"),
  ],
  courierTrackController.fetchRedxParcelDetails
);

router.route("/redx/remove-parcel/:courierTrackId").patch(
  [
    // celebrate(orderValidation.returnRefundOrder),
    verifyToken,
    permission("admin", "employee"),
  ],
  courierTrackController.removeRedxFromOrder
);

//= ===================== STEADFASET ===============
router
  .route("/steadfast/create-parcel")
  .post(
    [
      celebrate(courierTrackValidation.createSteadfastParcel),
      verifyToken,
      permission("admin", "employee"),
    ],
    courierTrackController.createSteadfastParcel
  );

router.route("/steadfast/parcel/:courierTrackId").get(
  [
    // celebrate(orderValidation.returnRefundOrder),
    verifyToken,
    permission("admin", "employee"),
  ],
  courierTrackController.fetchSteadfastParcelDetails
);

router.route("/steadfast/remove-parcel/:courierTrackId").patch(
  [
    // celebrate(orderValidation.returnRefundOrder),
    verifyToken,
    permission("admin", "employee"),
  ],
  courierTrackController.removeSteadfastFromOrder
);

module.exports = router;
