const router = require("express").Router();
const controller = require("./documentoController");
const auth = require("./auth");
const multer = require("multer");

// Configuração do multer para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "./uploads/documentos";
        if (!require("fs").existsSync(dir)) {
            require("fs").mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Apenas imagens e PDFs são permitidos"));
        }
    }
});

// Rotas
router.post("/", auth, controller.criar);
router.get("/", auth, controller.listar);
router.get("/estatisticas", auth, controller.estatisticas);
router.get("/:id", auth, controller.buscarPorId);
router.put("/:id", auth, controller.atualizar);
router.delete("/:id", auth, controller.excluir);

// Upload de arquivo
router.post("/:id/upload", auth, upload.single("arquivo"), controller.uploadArquivo);

module.exports = router;