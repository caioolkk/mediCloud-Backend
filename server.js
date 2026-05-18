require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const conectarBanco = require("./config/banco");
const app = express();

conectarBanco();

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Rotas da API
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pacientes", require("./routes/pacienteRoutes"));
app.use("/api/profissionais", require("./routes/profissionalRoutes"));
app.use("/api/documentos", require("./routes/documentoRoutes"));

// Rota padrão para servir o index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Porta dinâmica para Render
const PORT = process.env.PORTA || process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});