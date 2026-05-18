require("dotenv").config();
const express = require("express");
const cors = require("cors");
const conectarBanco = require("./banco");
const app = express();

conectarBanco();

app.use(cors());
app.use(express.json());

// Rotas (todos os arquivos na raiz)
app.use("/api/auth", require("./authRoutes"));
app.use("/api/pacientes", require("./pacienteRoutes"));
app.use("/api/profissionais", require("./profissionalRoutes"));
app.use("/api/documentos", require("./documentoRoutes"));

// Porta
const PORT = process.env.PORT || process.env.PORTA || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});