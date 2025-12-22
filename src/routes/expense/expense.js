const router = require("express").Router();
// const { celebrate } = require("celebrate");

const verifyToken = require("../../middlewares/verifyToken");
const permission = require("../../middlewares/permission");

const expenseController = require("../../controllers/expense/expenseController");

//= === expense head ====
router
  .route("/head-create")
  .post([verifyToken, permission("admin", "employee")], expenseController.expenseHeadCreate);

router
  .route("/head-update/:headId")
  .patch([verifyToken, permission("admin", "employee")], expenseController.expenseHeadUpdate);

router
  .route("/head-fetch-all")
  .get([verifyToken, permission("admin", "employee")], expenseController.expenseHeadViewAll);

router
  .route("/head-delete/:headId")
  .delete([verifyToken, permission("admin", "employee")], expenseController.expenseHeadDelete);

//= === expense ====
router
  .route("/create")
  .post([verifyToken, permission("admin", "employee")], expenseController.expenseCreate);

router
  .route("/update/:expenseId")
  .patch([verifyToken, permission("admin", "employee")], expenseController.expenseUpdate);

router
  .route("/delete/:expenseId")
  .delete([verifyToken, permission("admin", "employee")], expenseController.expenseDelete);

router
  .route("/single-fetch/:expenseId")
  .get([verifyToken, permission("admin", "employee")], expenseController.singleExpense);

router
  .route("/fetch-all")
  .post([verifyToken, permission("admin", "employee")], expenseController.expenseViewAll);

module.exports = router;
