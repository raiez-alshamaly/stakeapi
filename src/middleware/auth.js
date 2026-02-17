import jwt from 'jsonwebtoken';
import pool from '../db/index.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const result = await pool.query(
            'SELECT id, username, email, name, role, is_active, avatar FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found.' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated.' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Authentication failed.' });
    }
};

// Role-based access control
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated.' });
        }

        // Role hierarchy: superadmin > admin > editor > writer > viewer
        const roleHierarchy = {
            superadmin: 5,
            admin: 4,
            editor: 3,
            writer: 2,
            viewer: 1
        };

        const userRoleLevel = roleHierarchy[req.user.role] || 0;
        const requiredLevel = Math.min(...allowedRoles.map(r => roleHierarchy[r] || 0));

        if (userRoleLevel >= requiredLevel) {
            return next();
        }

        // Also check if user's exact role is in allowed roles
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    };
};

// Log activity (legacy function - kept for backwards compatibility)
export const logActivity = async (userId, action, entityType, entityId, details = {}, ipAddress) => {
    try {
        // Get username
        const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
        const username = userResult.rows[0]?.username || 'Unknown';

        await pool.query(
            `INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_title, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, username, action, entityType, entityId, details.username || details.title || 'N/A', JSON.stringify(details)]
        );
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Combined middleware for protected routes
export const protect = (roles = []) => {
    if (roles.length === 0) {
        return [authenticate];
    }
    return [authenticate, authorize(...roles)];
};
