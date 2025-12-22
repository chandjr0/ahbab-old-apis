const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const verifyTokenOrAvoid = require("../../middlewares/verifyTokenOrAvoid");
const permission = require("../../middlewares/permission");

const productController = require("../../controllers/product/productController");
const productValidation = require("../../validators/productValidation");
const { pageValidaiton } = require("../../validators/shareValidation");

const pageNoValidaiton = celebrate(pageValidaiton);
// const { removeHomeCache } = require("../../redis/homeCache");

router
  .route("/test")
  .post(
    [celebrate(productValidation.createProduct), verifyToken, permission("admin", "employee")],
    productController.test
  );

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

router
  .route("/single-product/:productSlug")
  .get(
    [
      celebrate(productValidation.productSlug),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchSingleProduct
  );

router
  .route("/admin/all-products") // ?page=1&limit=1
  .post(
    [
      celebrate(productValidation.fetchAllProductsByAdmin),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchAllProductsByAdmin
  );

router
  .route("/all-products") // ?page=1&limit=1&userType=ADMIN OR CUSTOMER
  .get(
    [
      celebrate(productValidation.productPaginationWithUserType),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchAllProducts
  );

router
  .route("/admin/all-productby-category/:categorySlug") // ?page=1&limit=1&userType=ADMIN OR CUSTOMER
  .get(
    [
      celebrate(productValidation.categorySlug),
      celebrate(productValidation.productPaginationWithUserType),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchAllProductByCategoryByAdmin
  );

router
  .route("/feature-products") // ?page=1&limit=1&userType=ADMIN OR CUSTOMER
  .get(
    [
      celebrate(productValidation.productPaginationWithUserType),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchFeatureProducts
  );

router
  .route("/new-arrival-products") // ?page=1&limit=1&userType=ADMIN OR CUSTOMER
  .get(
    [
      celebrate(productValidation.productPaginationWithUserType),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchNewArrivalProducts
  );

router
  .route("/best-deal-products") // ?page=1&limit=1&userType=ADMIN OR CUSTOMER
  .get(
    [
      celebrate(productValidation.productPaginationWithUserType),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchBestDealProducts
  );

router
  .route("/stock-alert-products") // ?page=1&limit=1
  .get(
    [pageNoValidaiton, verifyToken, permission("admin", "employee")],
    productController.fetchAllStockAlertProducts
  );

router
  .route("/single-product-stock-update/:productId")
  .patch(
    [verifyToken, permission("admin", "employee"), celebrate(productValidation.updateProductStock)],
    productController.updateSingleProductStock
  );

router
  .route("/search-by-sku-or-name") // ?page=1&limit=1&userType=ADMIN OR CUSTOMER
  .post(
    [
      celebrate(productValidation.productSearch),
      celebrate(productValidation.productPaginationWithUserType),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.searchProductsBySkuOrName
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

router
  .route("/pos-products") // ?page=1&limit=1
  .get(
    [pageNoValidaiton, verifyToken, permission("admin", "employee")],
    productController.fetchPosProducts
  );

router
  .route("/all-productby-category/:categorySlug") // ?page=1&limit=1&userType=ADMIN OR CUSTOMER
  .get(
    [
      celebrate(productValidation.categorySlug),
      celebrate(productValidation.productPaginationWithUserType),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchAllProductByCategory
  );

router
  .route("/all-productby-brand/:brandSlug") // ?page=1&limit=1&userType=ADMIN OR CUSTOMER
  .get(
    [
      celebrate(productValidation.brandSlug),
      celebrate(productValidation.productPaginationWithUserType),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchAllProductByBrand
  );

router
  .route("/today-flash-products") // ?page=1&limit=1
  .get(
    [
      pageNoValidaiton,
      // verifyToken, permission("admin", "employee")
    ],
    productController.fetchTodayFlashDealProducts
  );

router
  .route("/section-products/:sectionSlug") // ?page=1&limit=1&userType=ADMIN OR CUSTOMER
  .get(
    [
      celebrate(productValidation.productPaginationWithUserType),
      verifyTokenOrAvoid,
      permission("admin", "employee", "visitor", "customer"),
    ],
    productController.fetchSectionProducts
  );

module.exports = router;
