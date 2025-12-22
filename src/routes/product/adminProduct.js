const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const verifyTokenOrAvoid = require("../../middlewares/verifyTokenOrAvoid");
const permission = require("../../middlewares/permission");

const productController = require("../../controllers/product/adminProductController");
const productValidation = require("../../validators/productValidation");

router.route("/test").get(productController.test);

//= ==============   CRUD START ====================
router.route("/create").post(
  [
    celebrate(productValidation.createProduct),
    verifyToken,
    permission("admin", "employee"),

    // removeHomeCache,
  ],
  productController.createProduct
);

router.route("/update/:productId").patch(
  [
    celebrate(productValidation.updateProduct),
    verifyToken,
    permission("admin", "employee"),

    // removeHomeCache,
  ],
  productController.updateProduct
);

router.route("/delete/:productId").delete(
  [
    celebrate(productValidation.productId),
    verifyToken,
    permission("admin", "employee"),
    // removeHomeCache,
  ],
  productController.deleteProduct
);

router.route("/delete-variation/:variationId").delete(
  [
    verifyToken,
    permission("admin", "employee"),
    // removeHomeCache
  ],
  productController.deleteProductVariation
);

router.route("/update-top-pos").patch(
  [
    celebrate(productValidation.updateOrderSuggestedProduct),
    verifyToken,
    permission("admin", "employee"),
    // removeHomeCache,
  ],
  productController.updateOrderSuggestedProduct
);

router.route("/disable-or-approve").patch(
  [
    celebrate(productValidation.disableOrApproveOwnProduct),
    verifyToken,
    permission("admin", "employee"),
    // removeHomeCache,
  ],
  productController.disableOrApproveOwnProduct
);

router.route("/disable-enable/variation").patch(
  [
    celebrate(productValidation.updateProductVariationStatus),
    verifyToken,
    permission("admin", "employee"),
    // removeHomeCache,
  ],
  productController.updateProductVariationStatus
);

router.route("/feature").patch(
  [
    celebrate(productValidation.featureOwnProduct),
    verifyToken,
    permission("admin", "employee"),
    // removeHomeCache,
  ],
  productController.featureOwnProduct
);

router.route("/reseller").patch(
  [
    celebrate(productValidation.resellerProductStatusUpdate),
    verifyToken,
    permission("admin", "employee"),
    // removeHomeCache,
  ],
  productController.resellerProductStatusUpdate
);

//= ==============   CRUD START ====================
router
  .route("/all-products") // ?page=1&limit=1
  .post(
    [
      celebrate(productValidation.fetchAllProductsByAdmin),
      verifyTokenOrAvoid,
      permission("admin", "employee"),
    ],
    productController.fetchAllProductsByAdmin
  );

router
  .route("/search") // ?page=1&limit=1
  .post(
    [
      celebrate(productValidation.productSearch),
      verifyTokenOrAvoid,
      permission("admin", "employee"),
    ],
    productController.searchProductsBySkuOrName
  );

router
  .route("/pos-products") // ?page=1&limit=1
  .get(
    [celebrate(productValidation.pagination), verifyToken, permission("admin", "employee")],
    productController.fetchPosProducts
  );

router
  .route("/reseller-search") // ?page=1&limit=1
  .post(
    [
      celebrate(productValidation.productSearch),
      verifyTokenOrAvoid,
      permission("admin", "employee"),
    ],
    productController.searchProductsBySkuOrNameForReseller
  );

router
  .route("/reseller-pos-products") // ?page=1&limit=1
  .get(
    [celebrate(productValidation.pagination), verifyToken, permission("admin", "employee")],
    productController.fetchPosProductsForReseller
  );

router
  .route("/view/:productSlug")
  .get(
    [celebrate(productValidation.viewProduct), verifyTokenOrAvoid, permission("admin", "employee")],
    productController.viewProduct
  );

router
  .route("/download-csv")
  .get([verifyToken, permission("admin", "employee")], productController.downloadProductCSV);

module.exports = router;
