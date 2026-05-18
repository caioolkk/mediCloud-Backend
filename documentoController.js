const Documento = require("../models/Documento");

exports.criar = async (req, res) => {

    const documento = await Documento.create(req.body);

    res.json(documento);
};

exports.listar = async (req, res) => {

    const documentos = await Documento.find()
    .populate("pacienteId");

    res.json(documentos);
};