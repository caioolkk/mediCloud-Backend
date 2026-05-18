const Paciente = require("../models/Paciente");

exports.criar = async (req, res) => {
    try {
        const paciente = await Paciente.create(req.body);
        res.status(201).json(paciente);
    } catch (erro) {
        if(erro.code === 11000) return res.status(400).json({ erro: "CPF já cadastrado no sistema" });
        res.status(500).json(erro);
    }
};

exports.listar = async (req, res) => {
    res.json(await Paciente.find());
};

exports.buscar = async (req, res) => {
    try {
        const { nome, cpf, telefone, email } = req.query;
        let filtro = {};
        if (nome) filtro.nome = { $regex: nome, $options: "i" };
        if (cpf) filtro.cpf = { $regex: cpf, $options: "i" };
        if (telefone) filtro.telefone = { $regex: telefone, $options: "i" };
        if (email) filtro.email = { $regex: email, $options: "i" };
        
        res.json(await Paciente.find(filtro));
    } catch (erro) { res.status(500).json(erro); }
};

exports.atualizar = async (req, res) => {
    try {
        const paciente = await Paciente.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!paciente) return res.status(404).json({ erro: "Paciente não encontrado" });
        res.json(paciente);
    } catch (erro) {
        if(erro.code === 11000) return res.status(400).json({ erro: "CPF já cadastrado" });
        res.status(500).json(erro);
    }
};