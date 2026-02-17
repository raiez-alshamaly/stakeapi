import express from 'express';
import pool from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from './notifications.js';

const router = express.Router();

// GET all news (public)
router.get('/', async (req, res) => {
    try {
        const { type, status = 'published' } = req.query;
        let query = `
      SELECT n.*, p.name as platform_name, p.logo as platform_logo
      FROM news n
      LEFT JOIN platforms p ON n.platform_id = p.id
      WHERE n.status = $1
    `;
        const params = [status];

        if (type) {
            query += ' AND n.type = $2';
            params.push(type);
        }

        query += ' ORDER BY n.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// GET single news (public)
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const isNumeric = /^\d+$/.test(identifier);

        const query = isNumeric
            ? `SELECT n.*, p.name as platform_name, p.logo as platform_logo
         FROM news n
         LEFT JOIN platforms p ON n.platform_id = p.id
         WHERE n.id = $1`
            : `SELECT n.*, p.name as platform_name, p.logo as platform_logo
         FROM news n
         LEFT JOIN platforms p ON n.platform_id = p.id
         WHERE n.slug = $1`;

        const result = await pool.query(query, [identifier]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'News not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// POST create news (authenticated)
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, slug, type, platform_id, content, content_blocks, status = 'draft' } = req.body;

        const result = await pool.query(
            `INSERT INTO news (title, slug, type, platform_id, content, content_blocks, status, author_id, author_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [title, slug, type, platform_id, content, JSON.stringify(content_blocks || []), status, req.user.id, req.user.name || req.user.username]
        );

        const newsItem = result.rows[0];

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'create',
            entityType: 'news',
            entityId: newsItem.id,
            entityTitle: newsItem.title
        });

        res.status(201).json(newsItem);
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ error: 'Failed to create news' });
    }
});

// PUT update news (authenticated)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, type, platform_id, content, content_blocks, status } = req.body;

        const result = await pool.query(
            `UPDATE news SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        type = COALESCE($3, type),
        platform_id = COALESCE($4, platform_id),
        content = COALESCE($5, content),
        content_blocks = COALESCE($6, content_blocks),
        status = COALESCE($7, status),
        updated_by = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
            [title, slug, type, platform_id, content, content_blocks ? JSON.stringify(content_blocks) : null, status, req.user.id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'News not found' });
        }

        const newsItem = result.rows[0];

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'update',
            entityType: 'news',
            entityId: newsItem.id,
            entityTitle: newsItem.title
        });

        res.json(newsItem);
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ error: 'Failed to update news' });
    }
});

// DELETE news (authenticated, admin only)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Get news title before deleting
        const newsResult = await pool.query('SELECT title FROM news WHERE id = $1', [id]);
        const newsTitle = newsResult.rows[0]?.title || 'Unknown';

        const result = await pool.query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'News not found' });
        }

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'delete',
            entityType: 'news',
            entityId: parseInt(id),
            entityTitle: newsTitle
        });

        res.json({ message: 'News deleted successfully' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'Failed to delete news' });
    }
});

export default router;
