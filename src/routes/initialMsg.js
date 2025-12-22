const router = require("express").Router();
const initial = require("../controllers/initialMsg");

router.get("/", initial.initialMsg);

module.exports = router;
