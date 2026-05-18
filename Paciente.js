const mongoose = require("mongoose");
const PacienteSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    email: String,
    telefone: String,
    endereco: String,
    convenio: String,
    historico: String
}, { timestamps: true });
module.exports = mongoose.model("Paciente", PacienteSchema);