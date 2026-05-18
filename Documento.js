const mongoose = require("mongoose");

const DocumentoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descricao: String,
    tipo: { 
        type: String, 
        required: true,
        enum: ["prontuario", "exame", "prescricao", "relatorio", "anexo", "historico", "atestado", "encaminhamento", "alergia", "vacina"]
    },
    
    // Dados específicos para cada tipo
    paciente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Paciente"
    },
    medico: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profissional"
    },
    
    // Campos genéricos
    dataDocumento: { type: Date, default: Date.now },
    status: { type: String, default: "ativo", enum: ["ativo", "arquivado", "cancelado"] },
    arquivoUrl: String,
    arquivoTipo: String,
    tamanhoArquivo: Number,
    
    // Metadados
    criadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario"
    },
    
    // Campos específicos por tipo (flexível)
    dadosEspecificos: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Documento", DocumentoSchema);