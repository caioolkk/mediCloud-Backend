const Usuario = require("../models/Usuario");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

exports.registrar = async (req, res) => {

    try {

        const { nome, email, senha } = req.body;

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const usuario = await Usuario.create({
            nome,
            email,
            senha: senhaCriptografada
        });

        res.json(usuario);

    } catch (erro) {

        res.status(500).json(erro);

    }
};

exports.login = async (req, res) => {

    try {

        const { email, senha } = req.body;

        const usuario = await Usuario.findOne({ email });

        if(!usuario){

            return res.status(400).json({
                erro: "Usuário não encontrado"
            });
        }

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if(!senhaValida){

            return res.status(400).json({
                erro: "Senha incorreta"
            });
        }

        const token = jwt.sign({

            id: usuario._id

        }, process.env.JWT_SECRET);

        res.json({
            token,
            usuario
        });

    } catch (erro) {

        res.status(500).json(erro);

    }
};