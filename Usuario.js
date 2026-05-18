const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema({
    nome: String,

    email: {
        type: String,
        unique: true
    },

    senha: String,

    cargo: {
        type: String,
        default: "medico"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Usuario", UsuarioSchema);