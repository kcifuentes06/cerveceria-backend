const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({message: 'Acceso denegado. Se requiere un token de autenticación'});
    }

    const token = authHeader.substring(7);

    try {
        const decodificado = jwt.verify(token, JWT_SECRET);

        req.usuario_id = decodificado.id;
        req.usuario_email = decodificado.email;

        next();
    } catch (error){
        res.status(401).json({message: 'Token no valido o expirado.'});
    }
};

module.exports = authMiddleware;