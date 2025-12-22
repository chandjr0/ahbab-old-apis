const router = require("express").Router();
const { celebrate } = require("celebrate");
const customerController = require("../../../controllers/user/customer/adminCustomer");
const customerValidation = require("../../../validators/customerValidation");

const verifyToken = require("../../../middlewares/verifyToken");
const permission = require("../../../middlewares/permission");

router.post(
  "/direct-register",
  [celebrate(customerValidation.directCustomerRegistration)],
  customerController.directCustomerRegistration
);

router.post(
  "/register",
  [celebrate(customerValidation.customerRegistration)],
  customerController.customerRegistration
);

router.post(
  "/register-otp-verify",
  [celebrate(customerValidation.otpVerifyForRegistration)],
  customerController.otpVerifyForRegistration
);

router.post(
  "/forget-password",
  [celebrate(customerValidation.otpForResetRequest)],
  customerController.otpForResetRequest
);

router.post(
  "/verify-reset-otp",
  [celebrate(customerValidation.verifyOtpForResetPassword)],
  customerController.verifyOtpForResetPassword
);

router.post(
  "/reset-password",
  [celebrate(customerValidation.resetPassword)],
  customerController.resetPassword
);

router.post("/login", [celebrate(customerValidation.signin)], customerController.loginCustomer);

router.post("/login-otp-send", [celebrate(customerValidation.loginOtpSend)], customerController.loginOtpSend);

router.post("/login-otp-verify", [celebrate(customerValidation.loginOtpVerify)], customerController.loginOtpVerify);

router.patch(
  "/update",
  [celebrate(customerValidation.updateCustomer), verifyToken, permission("customer")],
  customerController.updateInformation
);

router.get("/profile-view", [verifyToken, permission("customer")], customerController.profileView);

router.patch(
  "/update-password",
  [celebrate(customerValidation.changePassword), verifyToken, permission("customer")],
  customerController.customerUpdatePassword
);

// WishList
router
  .route("/wishlist/insert/:productId")
  .post([verifyToken, permission("customer")], customerController.wishListInsert);

router
  .route("/wishList/remove/:productId")
  .post([verifyToken, permission("customer")], customerController.wishListRemove);

router
  .route("/wishlist/fetch")
  .get([verifyToken, permission("customer")], customerController.wishListFetch);

//= ==================== ADMIN START ==========================
router
  .route("/fetch-all") // ?page=1
  .get(
    [verifyToken, permission("admin", "employee"), celebrate(customerValidation.pageCheck)],
    customerController.allCustomers
  );

router
  .route("/list") // ?page=1
  .post(
    [
      verifyToken,
      permission("admin", "employee"),
      celebrate(customerValidation.fetchAllCustomerList),
    ],
    customerController.fetchAllCustomerList
  );

router
  .route("/fetch-single/:customerId")
  .get([verifyToken, permission("admin", "employee")], customerController.singleCustomer);

router
  .route("/order-details/:customerId")
  .get(
    [verifyToken, permission("admin", "employee")],
    customerController.singleCustomerOrderDetails
  );

router
  .route("/fetch-by-phone")
  .post([verifyToken, permission("admin", "employee")], customerController.fetchCustomersByPhone);

router
  .route("/fetch-by-phone-or-name")
  .post(
    [
      verifyToken,
      permission("admin", "employee"),
      celebrate(customerValidation.fetchCustomersByPhoneOrName),
    ],
    customerController.fetchCustomersByPhoneOrName
  );

//= ==================== ADMIN END ==========================

//= =========== sms ============
router
  .route("/all-numbers")
  .get([verifyToken, permission("admin", "employee")], customerController.allCustomersNumber);

router
  .route("/promotional-bulk-msg")
  .post(
    [
      verifyToken,
      permission("admin", "employee"),
      celebrate(customerValidation.promotionalBulkSms),
    ],
    customerController.promotionalBulkSms
  );

router
  .route("/fetch-all-sms") // ?page=1
  .get(
    [verifyToken, permission("admin", "employee"), celebrate(customerValidation.pageCheck)],
    customerController.fetchSmsList
  );

module.exports = router;
