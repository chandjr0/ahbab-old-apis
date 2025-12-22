const router = require("express").Router();
const { celebrate } = require("celebrate");
const customerController = require("../../../controllers/user/customer/resellerCustomer");
const customerValidation = require("../../../validators/customerValidation");

const verifyToken = require("../../../middlewares/verifyToken");
const permission = require("../../../middlewares/permission");
const verifyReseller = require("../../../middlewares/verifyReseller");
const allowReseller = require("../../../middlewares/allowReseller");

router.post(
  "/direct-register",
  [
    verifyReseller,
    allowReseller("active"),
    celebrate(customerValidation.directCustomerRegistration),
  ],
  customerController.directCustomerRegistration
);

router.post(
  "/register",
  [verifyReseller, allowReseller("active"), celebrate(customerValidation.customerRegistration)],
  customerController.customerRegistration
);

router.post(
  "/register-otp-verify",
  [verifyReseller, allowReseller("active"), celebrate(customerValidation.otpVerifyForRegistration)],
  customerController.otpVerifyForRegistration
);

router.post(
  "/forget-password",
  [verifyReseller, allowReseller("active"), celebrate(customerValidation.otpForResetRequest)],
  customerController.otpForResetRequest
);

router.post(
  "/verify-reset-otp",
  [
    verifyReseller,
    allowReseller("active"),
    celebrate(customerValidation.verifyOtpForResetPassword),
  ],
  customerController.verifyOtpForResetPassword
);

router.post(
  "/reset-password",
  [verifyReseller, allowReseller("active"), celebrate(customerValidation.resetPassword)],
  customerController.resetPassword
);

router.post(
  "/login",
  [verifyReseller, allowReseller("active"), celebrate(customerValidation.signin)],
  customerController.loginCustomer
);

router.patch(
  "/update",
  [
    verifyReseller,
    allowReseller("active"),
    verifyToken,
    permission("customer"),
    celebrate(customerValidation.updateCustomer),
  ],
  customerController.updateInformation
);

router.get(
  "/profile-view",
  [verifyReseller, allowReseller("active"), verifyToken, permission("customer")],
  customerController.profileView
);

router.patch(
  "/update-password",
  [
    verifyReseller,
    allowReseller("active"),
    verifyToken,
    permission("customer"),
    celebrate(customerValidation.changePassword),
  ],
  customerController.customerUpdatePassword
);

// WishList
router
  .route("/wishlist/insert/:productId")
  .post(
    [verifyReseller, allowReseller("active"), verifyToken, permission("customer")],
    customerController.wishListInsert
  );

router
  .route("/wishList/remove/:productId")
  .post(
    [verifyReseller, allowReseller("active"), verifyToken, permission("customer")],
    customerController.wishListRemove
  );

router
  .route("/wishlist/fetch")
  .get(
    [verifyReseller, allowReseller("active"), verifyToken, permission("customer")],
    customerController.wishListFetch
  );

//= ==================== ADMIN START ==========================
router
  .route("/fetch-all") // ?page=1
  .get(
    [verifyToken, permission("reseller", "reseller_emp"), celebrate(customerValidation.pageCheck)],
    customerController.allCustomers
  );

router
  .route("/list") // ?page=1
  .post(
    [
      verifyToken,
      permission("reseller", "reseller_emp"),
      celebrate(customerValidation.fetchAllCustomerList),
    ],
    customerController.fetchAllCustomerList
  );

router
  .route("/fetch-single/:customerId")
  .get([verifyToken, permission("reseller", "reseller_emp")], customerController.singleCustomer);

router
  .route("/order-details/:customerId")
  .get(
    [verifyToken, permission("reseller", "reseller_emp")],
    customerController.singleCustomerOrderDetails
  );

router
  .route("/fetch-by-phone")
  .post(
    [verifyToken, permission("reseller", "reseller_emp")],
    customerController.fetchCustomersByPhone
  );

router
  .route("/fetch-by-phone-or-name")
  .post(
    [
      verifyToken,
      permission("reseller", "reseller_emp"),
      celebrate(customerValidation.fetchCustomersByPhoneOrName),
    ],
    customerController.fetchCustomersByPhoneOrName
  );

//= ==================== ADMIN END ==========================

module.exports = router;
