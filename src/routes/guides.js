import express from 'express';
import pool from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from './notifications.js';

const router = express.Router();

// GET all guides (public)
router.get('/', async (req, res) => {
    try {
        const { category, status = 'published' } = req.query;
        let query = 'SELECT * FROM guides WHERE status = $1';
        const params = [status];

        if (category) {
            query += ' AND category = $2';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching guides:', error);
        res.status(500).json({ error: 'Failed to fetch guides' });
    }
});

// GET single guide (public)
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const isNumeric = /^\d+$/.test(identifier);

        const query = isNumeric
            ? 'SELECT * FROM guides WHERE id = $1'
            : 'SELECT * FROM guides WHERE slug = $1';

        const result = await pool.query(query, [identifier]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Guide not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching guide:', error);
        res.status(500).json({ error: 'Failed to fetch guide' });
    }
});

// POST create guide (authenticated)
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, slug, category, excerpt, content, content_blocks, read_time, status = 'draft' } = req.body;

        const result = await pool.query(
            `INSERT INTO guides (title, slug, category, excerpt, content, content_blocks, read_time, status, author_id, author_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [title, slug, category, excerpt, content, JSON.stringify(content_blocks || []), read_time, status, req.user.id, req.user.name || req.user.username]
        );

        const guide = result.rows[0];

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'create',
            entityType: 'guide',
            entityId: guide.id,
            entityTitle: guide.title
        });

        res.status(201).json(guide);
    } catch (error) {
        console.error('Error creating guide:', error);
        res.status(500).json({ error: 'Failed to create guide' });
    }
});

// PUT update guide (authenticated)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, category, excerpt, content, content_blocks, read_time, status } = req.body;

        const result = await pool.query(
            `UPDATE guides SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        category = COALESCE($3, category),
        excerpt = COALESCE($4, excerpt),
        content = COALESCE($5, content),
        content_blocks = COALESCE($6, content_blocks),
        read_time = COALESCE($7, read_time),
        status = COALESCE($8, status),
        updated_by = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *`,
            [title, slug, category, excerpt, content, content_blocks ? JSON.stringify(content_blocks) : null, read_time, status, req.user.id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Guide not found' });
        }

        const guide = result.rows[0];

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'update',
            entityType: 'guide',
            entityId: guide.id,
            entityTitle: guide.title
        });

        res.json(guide);
    } catch (error) {
        console.error('Error updating guide:', error);
        res.status(500).json({ error: 'Failed to update guide' });
    }
});

// DELETE guide (authenticated, admin only)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Get guide title before deleting
        const guideResult = await pool.query('SELECT title FROM guides WHERE id = $1', [id]);
        const guideTitle = guideResult.rows[0]?.title || 'Unknown';

        const result = await pool.query('DELETE FROM guides WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Guide not found' });
        }

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'delete',
            entityType: 'guide',
            entityId: parseInt(id),
            entityTitle: guideTitle
        });

        res.json({ message: 'Guide deleted successfully' });
    } catch (error) {
        console.error('Error deleting guide:', error);
        res.status(500).json({ error: 'Failed to delete guide' });
    }
});

export default router;
