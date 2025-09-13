import { Router } from 'express';
import passport from '../config/passport.js';
import { AuthService } from '../services/auth.js';
import { requireAuth, requireGuest } from '../middleware/auth.js';
const router = Router();
// Validation helper
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}
/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', requireGuest, async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Email and password are required'
                }
            });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid email format'
                }
            });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
                }
            });
        }
        // Create user
        const user = await AuthService.createUser({ email, password });
        // Log in the user automatically after registration
        req.login(user, (err) => {
            if (err) {
                console.error('Login error after registration:', err);
                return res.status(500).json({
                    success: false,
                    error: {
                        code: 'LOGIN_ERROR',
                        message: 'User created but login failed'
                    }
                });
            }
            return res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        subscriptionTier: user.subscriptionTier,
                        monthlyUsage: user.monthlyUsage
                    }
                }
            });
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Error && error.message === 'User already exists with this email') {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'USER_EXISTS',
                    message: 'User already exists with this email'
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Registration failed'
            }
        });
    }
});
/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', requireGuest, (req, res, next) => {
    const { email, password } = req.body;
    // Validation
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Email and password are required'
            }
        });
    }
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Authentication error:', err);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Authentication failed'
                }
            });
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: info?.message || 'Invalid email or password'
                }
            });
        }
        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return res.status(500).json({
                    success: false,
                    error: {
                        code: 'LOGIN_ERROR',
                        message: 'Login failed'
                    }
                });
            }
            return res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        subscriptionTier: user.subscriptionTier,
                        monthlyUsage: user.monthlyUsage
                    }
                }
            });
        });
    })(req, res, next);
});
/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', requireAuth, (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'LOGOUT_ERROR',
                    message: 'Logout failed'
                }
            });
        }
        return res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});
/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', requireAuth, (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'No authenticated user'
            }
        });
    }
    return res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                subscriptionTier: user.subscriptionTier,
                monthlyUsage: user.monthlyUsage
            }
        }
    });
});
export default router;
//# sourceMappingURL=auth.js.map