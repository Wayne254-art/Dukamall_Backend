

const jwt = require('jsonwebtoken');

module.exports.customerMiddleware = async (req, res, next) => {
    const { customerToken } = req.cookies;

    // console.log('Cookies:', req.cookies);
    // console.log('Customer Token:', customerToken);

    if (!customerToken) {
        return res.status(409).json({ error: 'Please login first' });
    } else {
        try {
            const decodedToken = await jwt.verify(customerToken, process.env.SECRET);
            req.role = decodedToken.role;
            req.id = decodedToken.id;
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(409).json({ error: 'Please login' });
        }
    }
};
