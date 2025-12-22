const router = require("express").Router();
const { celebrate } = require("celebrate");

const productController = require("../../controllers/product/resellerCustomerController");
const productValidation = require("../../validators/productValidation");

router
  .route("/all-products") // ?page=1&limit=1
  .get([celebrate(productValidation.pagination)], productController.fetchAllProducts);

router
  .route("/best-products") // ?page=1&limit=1
  .get([celebrate(productValidation.pagination)], productController.fetchAllBestProducts);

router
  .route("/feature-products") // ?page=1&limit=1
  .get([celebrate(productValidation.pagination)], productController.fetchAllFeatureProducts);

router
  .route("/flash-products") // ?page=1&limit=1
  .get([celebrate(productValidation.pagination)], productController.fetchAllFlashProducts);

router
  .route("/search") // ?page=1&limit=1
  .post([celebrate(productValidation.productSearch)], productController.searchProductsBySkuOrName);

router
  .route("/productBy-category/:categorySlug") // ?page=1&limit=1
  .get(
    [celebrate(productValidation.fetchAllProductByCategory)],
    productController.fetchAllProductByCategory
  );

router
  .route("/productBy-brand/:brandSlug") // ?page=1&limit=1
  .post(
    [celebrate(productValidation.fetchAllProductByBrand)],
    productController.fetchAllProductByBrand
  );

router
  .route("/view/:productSlug")
  .get([celebrate(productValidation.viewProduct)], productController.viewProduct);

router
  .route("/view-with-similar/:productSlug") // ?similarLimit=12
  .get(
    [celebrate(productValidation.viewProductWithSimilarProduct)],
    productController.viewProductWithSimilarProduct
  );

router
  .route("/check-product-stock") // ?similarLimit=12
  .post([celebrate(productValidation.checkProductStock)], productController.checkProductStock);

module.exports = router;
