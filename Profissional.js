const mongoose = require("mongoose");
const ProfissionalSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    crm: { type: String, required: true },
    especialidade: { type: String, required: true },
    telefone: String,
    endereco: String
}, { timestamps: true });
module.exports = mongoose.model("Profissional", ProfissionalSchema);