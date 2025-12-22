const router = require("express").Router();
const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");
const categoryController = require("../../controllers/productAssets/categoryController");
const categoryValidation = require("../../validators/categoryValidation");

router
  .route("/create")
  .post(
    [verifyToken, permission("admin", "employee"), celebrate(categoryValidation.createCategory)],
    categoryController.createCategory
  );

router
  .route("/update/:categoryId")
  .patch(
    [verifyToken, permission("admin", "employee"), celebrate(categoryValidation.updateCategory)],
    categoryController.updateCategory
  );

router
  .route("/delete/:categoryId")
  .delete([verifyToken, permission("admin", "employee")], categoryController.deleteCategory);

router.route("/fetch-all").get(
  // [verifyToken, permission("admin", "employee")],
  categoryController.fetchAllCategory
);

router.route("/single-fetch/:categoryId").get(
  // [verifyToken, permission("admin", "employee")],
  categoryController.fetchSingleCategory
);

router
  .route("/commission-details/:categoryId")
  .get(
    [verifyToken, permission("admin", "employee")],
    categoryController.fetchCategoryCommissionDetails
  );

router
  .route("/reseller/add-commission")
  .post(
    [
      celebrate(categoryValidation.addCategoryProductCommissions),
      verifyToken,
      permission("admin", "employee"),
    ],
    categoryController.addCategoryProductCommissions
  );

router
  .route("/reseller/remove-commission/:categoryId")
  .delete(
    [verifyToken, permission("admin", "employee")],
    categoryController.removeCategoryProductCommissions
  );

router.route("/search").post(
  // [verifyToken, permission("admin", "employee")],
  categoryController.categorySearch
);

module.exports = router;
