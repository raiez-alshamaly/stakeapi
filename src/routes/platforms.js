import express from 'express';
import pool from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from './notifications.js';

const router = express.Router();

// GET all platforms (public)
router.get('/', async (req, res) => {
    try {
        const { type, status = 'published' } = req.query;
        let query = 'SELECT * FROM platforms WHERE status = $1';
        const params = [status];

        if (type) {
            query += ' AND $2 = ANY(type)';
            params.push(type);
        }

        query += ' ORDER BY rating DESC, updated_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching platforms:', error);
        res.status(500).json({ error: 'Failed to fetch platforms' });
    }
});

// GET single platform by ID or slug (public)
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const isNumeric = /^\d+$/.test(identifier);

        const query = isNumeric
            ? 'SELECT * FROM platforms WHERE id = $1'
            : 'SELECT * FROM platforms WHERE slug = $1';

        const result = await pool.query(query, [identifier]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Platform not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching platform:', error);
        res.status(500).json({ error: 'Failed to fetch platform' });
    }
});

// POST create new platform (authenticated)
router.post('/', authenticate, async (req, res) => {
    try {
        const {
            name, slug, rating, payout_speed, bonus, type, strengths,
            considerations, logo, description, markets, payments,
            security, support, features, affiliate_url, status = 'draft'
        } = req.body;

        const result = await pool.query(
            `INSERT INTO platforms (
        name, slug, rating, payout_speed, bonus, type, strengths,
        considerations, logo, description, markets, payments,
        security, support, features, affiliate_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
            [name, slug, rating, payout_speed, bonus, type, strengths,
                considerations, logo, description, markets, payments,
                security, support, JSON.stringify(features), affiliate_url, status]
        );

        const platform = result.rows[0];

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'create',
            entityType: 'platform',
            entityId: platform.id,
            entityTitle: platform.name
        });

        res.status(201).json(platform);
    } catch (error) {
        console.error('Error creating platform:', error);
        res.status(500).json({ error: 'Failed to create platform' });
    }
});

// PUT update platform (authenticated)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, slug, rating, payout_speed, bonus, type, strengths,
            considerations, logo, description, markets, payments,
            security, support, features, affiliate_url, status
        } = req.body;

        const result = await pool.query(
            `UPDATE platforms SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        rating = COALESCE($3, rating),
        payout_speed = COALESCE($4, payout_speed),
        bonus = COALESCE($5, bonus),
        type = COALESCE($6, type),
        strengths = COALESCE($7, strengths),
        considerations = COALESCE($8, considerations),
        logo = COALESCE($9, logo),
        description = COALESCE($10, description),
        markets = COALESCE($11, markets),
        payments = COALESCE($12, payments),
        security = COALESCE($13, security),
        support = COALESCE($14, support),
        features = COALESCE($15, features),
        affiliate_url = COALESCE($16, affiliate_url),
        status = COALESCE($17, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *`,
            [name, slug, rating, payout_speed, bonus, type, strengths,
                considerations, logo, description, markets, payments,
                security, support, features ? JSON.stringify(features) : null, affiliate_url, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Platform not found' });
        }

        const platform = result.rows[0];

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'update',
            entityType: 'platform',
            entityId: platform.id,
            entityTitle: platform.name
        });

        res.json(platform);
    } catch (error) {
        console.error('Error updating platform:', error);
        res.status(500).json({ error: 'Failed to update platform' });
    }
});

// DELETE platform (authenticated, admin only)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Get platform name before deleting
        const platformResult = await pool.query('SELECT name FROM platforms WHERE id = $1', [id]);
        const platformName = platformResult.rows[0]?.name || 'Unknown';

        const result = await pool.query('DELETE FROM platforms WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Platform not found' });
        }

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'delete',
            entityType: 'platform',
            entityId: parseInt(id),
            entityTitle: platformName
        });

        res.json({ message: 'Platform deleted successfully' });
    } catch (error) {
        console.error('Error deleting platform:', error);
        res.status(500).json({ error: 'Failed to delete platform' });
    }
});

export default router;
