const Profissional = require("./Profissional");
const bcrypt = require("bcryptjs");

exports.criar = async (req, res) => {
    try {
        const { nome, email, senha, cpf, crm, especialidade, telefone, endereco } = req.body;
        const senhaHash = await bcrypt.hash(senha, 10);
        const prof = await Profissional.create({ nome, email, senha: senhaHash, cpf, crm, especialidade, telefone, endereco });
        res.status(201).json(prof);
    } catch (erro) {
        if(erro.code === 11000) return res.status(400).json({ erro: "Email ou CPF já cadastrado no sistema" });
        res.status(500).json(erro);
    }
};

exports.listar = async (req, res) => {
    const profissionais = await Profissional.find().select("-senha");
    res.json(profissionais);
};

exports.buscar = async (req, res) => {
    try {
        const { termo } = req.query;
        if (!termo) return res.json([]);
        const regex = new RegExp(termo, "i");
        const profissionais = await Profissional.find({
            $or: [{ nome: regex }, { cpf: regex }, { email: regex }, { telefone: regex }, { crm: regex }]
        }).select("-senha");
        res.json(profissionais);
    } catch (erro) { res.status(500).json(erro); }
};

exports.atualizar = async (req, res) => {
    try {
        let dados = { ...req.body };
        if (dados.senha && dados.senha !== "") {
            dados.senha = await bcrypt.hash(dados.senha, 10);
        }
        const prof = await Profissional.findByIdAndUpdate(req.params.id, dados, { new: true }).select("-senha");
        if (!prof) return res.status(404).json({ erro: "Profissional não encontrado" });
        res.json(prof);
    } catch (erro) {
        if(erro.code === 11000) return res.status(400).json({ erro: "Email ou CPF já em uso" });
        res.status(500).json(erro);
    }
};

exports.deletar = async (req, res) => {
    try {
        const prof = await Profissional.findByIdAndDelete(req.params.id);
        if (!prof) return res.status(404).json({ erro: "Não encontrado" });
        res.json({ msg: "Profissional removido" });
    } catch (erro) { res.status(500).json(erro); }
};