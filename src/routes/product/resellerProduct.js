const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const verifyTokenOrAvoid = require("../../middlewares/verifyTokenOrAvoid");
const permission = require("../../middlewares/permission");

const productController = require("../../controllers/product/resellerProductController");
const productValidation = require("../../validators/productValidation");

router
  .route("/all-products") // ?page=1&limit=1
  .post(
    [
      celebrate(productValidation.fetchAllProductsByReseller),
      verifyTokenOrAvoid,
      permission("reseller", "reseller_emp"),
    ],
    productController.fetchAllProductsByReseller
  );

router
  .route("/search") // ?page=1&limit=1
  .post(
    [
      celebrate(productValidation.productSearch),
      verifyTokenOrAvoid,
      permission("reseller", "reseller_emp"),
    ],
    productController.searchProductsBySkuOrName
  );

router
  .route("/pos-products") // ?page=1&limit=1
  .get(
    [celebrate(productValidation.pagination), verifyToken, permission("reseller", "reseller_emp")],
    productController.fetchPosProducts
  );

router
  .route("/view/:productSlug")
  .get(
    [
      celebrate(productValidation.viewProduct),
      verifyTokenOrAvoid,
      permission("reseller", "reseller_emp"),
    ],
    productController.viewProduct
  );

module.exports = router;
