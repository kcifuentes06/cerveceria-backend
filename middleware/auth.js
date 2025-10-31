const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

module.exports = function(req, res, next) {

    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }


    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        

        req.usuario = decoded.usuario;
        

        next(); 
    } catch (err) {

        res.status(401).json({ msg: 'Token no válido' });
    }
};