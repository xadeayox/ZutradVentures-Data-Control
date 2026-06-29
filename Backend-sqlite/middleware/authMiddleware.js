const jwt = require('jsonwebtoken');

// ─── What is middleware? ──────────────────────────────────────────────────────
// Middleware is a function that runs BETWEEN the request and the route handler.
// Think of it as a security guard at the door — before any protected route runs,
// this function checks if the user is logged in and has a valid token.
// If yes, it lets them through. If no, it blocks them with a 401 error.

// ─── How JWT works in requests ────────────────────────────────────────────────
// After login, the frontend saves a token in localStorage.
// For every protected request, the frontend sends the token in the request header:
//   Authorization: Bearer <token>
// This middleware reads that header, verifies the token, and attaches the
// decoded user info (id, role, email) to req.user so routes can use it.

function protect(req, res, next) {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // extract the token after "Bearer "

    try {
        // Verify the token using the same secret used to sign it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // attach decoded user info to the request
        next(); // move on to the actual route handler
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized. Invalid or expired token.' });
    }
}

// ─── Role-based middleware ────────────────────────────────────────────────────
// This is used to restrict certain routes to specific roles.
// Usage: router.post('/create', protect, restrictTo('administrator'), handler)
// If the logged-in user's role isn't in the allowed list, they get a 403 error.

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
