/**
 * Middleware to ensure user is authenticated
 */
export function requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({
        success: false,
        error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
        }
    });
}
/**
 * Middleware to check if user is already authenticated (for login/register routes)
 */
export function requireGuest(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.status(400).json({
        success: false,
        error: {
            code: 'ALREADY_AUTHENTICATED',
            message: 'User is already authenticated'
        }
    });
}
/**
 * Optional authentication middleware - doesn't block if not authenticated
 */
export function optionalAuth(_req, _res, next) {
    // Always proceed, user may or may not be authenticated
    next();
}
//# sourceMappingURL=auth.js.map