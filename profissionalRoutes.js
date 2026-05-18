const router = require("express").Router();
const controller = require("./profissionalController");
const auth = require("./auth");

router.post("/", auth, controller.criar);
router.get("/", auth, controller.listar);
router.get("/buscar", auth, controller.buscar);
router.put("/:id", auth, controller.atualizar);
router.delete("/:id", auth, controller.deletar);

module.exports = router;