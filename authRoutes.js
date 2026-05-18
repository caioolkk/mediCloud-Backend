const router = require("express").Router();

const authController = require("./authController");

router.post("/registrar", authController.registrar);

router.post("/login", authController.login);

module.exports = router;