import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/index.js';
import { authenticate, authorize, logActivity } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /users/roles/list - Get available roles (MUST be before /:id)
router.get('/roles/list', authorize('superadmin', 'admin'), async (req, res) => {
    const roles = [
        { value: 'superadmin', label: 'Super Admin', description: 'Full access to everything' },
        { value: 'admin', label: 'Admin', description: 'Manage users and all content' },
        { value: 'editor', label: 'Editor', description: 'Edit and publish content' },
        { value: 'writer', label: 'Writer', description: 'Create and edit own content' },
        { value: 'viewer', label: 'Viewer', description: 'View dashboard only' }
    ];

    // Non-superadmins can't see superadmin role
    if (req.user.role !== 'superadmin') {
        res.json(roles.filter(r => r.value !== 'superadmin'));
    } else {
        res.json(roles);
    }
});

// GET /users - Get all users (admin only)
router.get('/', authorize('superadmin', 'admin'), async (req, res) => {
    try {
        const { role, status } = req.query;

        let query = `
      SELECT id, username, email, name, role, avatar, is_active, last_login, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
        const params = [];

        if (role) {
            params.push(role);
            query += ` AND role = $${params.length}`;
        }

        if (status === 'active') {
            query += ' AND is_active = true';
        } else if (status === 'inactive') {
            query += ' AND is_active = false';
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// GET /users/:id - Get single user
router.get('/:id', authorize('superadmin', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, username, email, name, role, avatar, is_active, last_login, created_at, updated_at
       FROM users WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user.' });
    }
});

// POST /users - Create new user (admin only)
router.post('/', authorize('superadmin', 'admin'), async (req, res) => {
    try {
        const { username, email, password, name, role = 'viewer', is_active = true } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Check if username or email exists
        const existing = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists.' });
        }

        // Prevent non-superadmins from creating superadmin users
        if (role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only superadmins can create superadmin users.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (username, email, password, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, name, role, avatar, is_active, created_at`,
            [username, email, hashedPassword, name, role, is_active]
        );

        await logActivity(req.user.id, 'create_user', 'user', result.rows[0].id, { username, role }, req.ip);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user.' });
    }
});

// PUT /users/:id - Update user
router.put('/:id', authorize('superadmin', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, name, role, is_active, avatar, password } = req.body;

        // Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const targetUser = userResult.rows[0];

        // Prevent non-superadmins from modifying superadmin users
        if (targetUser.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Cannot modify superadmin users.' });
        }

        // Prevent changing role to superadmin unless you're a superadmin
        if (role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only superadmins can assign superadmin role.' });
        }

        // Check for duplicate username/email
        if (username || email) {
            const existing = await pool.query(
                'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
                [username || '', email || '', id]
            );
            if (existing.rows.length > 0) {
                return res.status(400).json({ error: 'Username or email already in use.' });
            }
        }

        // Build update query
        let updateFields = [];
        let params = [];
        let paramCount = 1;

        if (username) {
            updateFields.push(`username = $${paramCount++}`);
            params.push(username);
        }
        if (email) {
            updateFields.push(`email = $${paramCount++}`);
            params.push(email);
        }
        if (name !== undefined) {
            updateFields.push(`name = $${paramCount++}`);
            params.push(name);
        }
        if (role) {
            updateFields.push(`role = $${paramCount++}`);
            params.push(role);
        }
        if (is_active !== undefined) {
            updateFields.push(`is_active = $${paramCount++}`);
            params.push(is_active);
        }
        if (avatar !== undefined) {
            updateFields.push(`avatar = $${paramCount++}`);
            params.push(avatar);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push(`password = $${paramCount++}`);
            params.push(hashedPassword);
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const result = await pool.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, username, email, name, role, avatar, is_active, last_login, created_at, updated_at`,
            params
        );

        await logActivity(req.user.id, 'update_user', 'user', parseInt(id), { changes: Object.keys(req.body) }, req.ip);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user.' });
    }
});

// DELETE /users/:id - Delete user (superadmin only)
router.delete('/:id', authorize('superadmin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account.' });
        }

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        await logActivity(req.user.id, 'delete_user', 'user', parseInt(id), { username: result.rows[0].username }, req.ip);

        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

export default router;
