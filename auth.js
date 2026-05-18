const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    const token = req.headers.authorization;

    if(!token){
        return res.status(401).json({
            erro: "Token inválido"
        });
    }

    try {

        const tokenLimpo = token.replace("Bearer ", "");

        jwt.verify(tokenLimpo, process.env.JWT_SECRET);

        next();

    } catch {

        return res.status(401).json({
            erro: "Não autorizado"
        });
    }
};