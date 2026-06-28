const jwt = require('jsonwebtoken');

// ─── protect middleware ───────────────────────────────────────────────────────
// Reads the JWT from the Authorization header, verifies it, and attaches
// the decoded user payload to req.user so downstream routes can use it.

function protect(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized. Invalid or expired token.' });
    }
}

// ─── restrictTo middleware ────────────────────────────────────────────────────
// Restricts a route to specific roles.
// Usage: router.post('/create', protect, restrictTo('administrator'), handler)

function restrictTo(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. This action is for: ${roles.join(', ')} only.`
            });
        }
        next();
    };
}

module.exports = { protect, restrictTo };
