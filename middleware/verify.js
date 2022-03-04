const jwt = require('jsonwebtoken')

const verifyJWT = (req, res, next) => {
    const token = req.header('x-access-token')

    if (!token) {
        res.status(401).json({ unauthorized: true })
    } else {
        jwt.verify(token, process.env.SECRET_JWT_KEY, (err, decoded) => {
            if (err) {
                res.status(400).json(err)
            } else {
                req.userId = decoded.id
                next()
            }
        })
    }
}

module.exports = verifyJWT
