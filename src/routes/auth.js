import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/index.js';
import { authenticate, logActivity } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // Find user by username or email
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Log activity
        await logActivity(user.id, 'login', 'user', user.id, { method: 'password' }, req.ip);

        // Generate token
        const token = generateToken(user.id);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// GET /auth/me - Get current user
router.get('/me', authenticate, async (req, res) => {
    res.json({ user: req.user });
});

// PUT /auth/me - Update current user profile
router.put('/me', authenticate, async (req, res) => {
    try {
        const { name, email, avatar } = req.body;
        const userId = req.user.id;

        // Check if email is taken by another user
        if (email) {
            const existing = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );
            if (existing.rows.length > 0) {
                return res.status(400).json({ error: 'Email is already in use.' });
            }
        }

        const result = await pool.query(
            `UPDATE users SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        avatar = COALESCE($3, avatar),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, username, email, name, role, avatar`,
            [name, email, avatar, userId]
        );

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

// PUT /auth/password - Change password
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Get current password hash
        const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, userId]
        );

        await logActivity(userId, 'password_change', 'user', userId, {}, req.ip);

        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to change password.' });
    }
});

// POST /auth/logout (optional - for logging purposes)
router.post('/logout', authenticate, async (req, res) => {
    try {
        await logActivity(req.user.id, 'logout', 'user', req.user.id, {}, req.ip);
        res.json({ message: 'Logged out successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed.' });
    }
});

export default router;
