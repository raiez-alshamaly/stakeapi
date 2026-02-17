import express from 'express';
import pool from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from './notifications.js';

const router = express.Router();

// Get all pages (Public - only published, Admin - all)
router.get('/', async (req, res) => {
    try {
        let query = 'SELECT * FROM pages ORDER BY created_at DESC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single page by slug (Public)
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query('SELECT * FROM pages WHERE slug = $1', [slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Page not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create page (Admin only)
router.post('/', authenticate, authorize('admin', 'superadmin', 'editor'), async (req, res) => {
    const { title, slug, content, content_blocks, meta_description, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO pages (title, slug, content, content_blocks, meta_description, status, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, slug, content, JSON.stringify(content_blocks || []), meta_description, status, req.user.id]
        );

        const page = result.rows[0];

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'create',
            entityType: 'page',
            entityId: page.id,
            entityTitle: page.title
        });

        res.status(201).json(page);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update page (Admin only)
router.put('/:id', authenticate, authorize('admin', 'superadmin', 'editor'), async (req, res) => {
    const { id } = req.params;
    const { title, slug, content, content_blocks, meta_description, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE pages SET title = $1, slug = $2, content = $3, content_blocks = $4, meta_description = $5, status = $6, updated_by = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
            [title, slug, content, JSON.stringify(content_blocks || []), meta_description, status, req.user.id, id]
        );

        const page = result.rows[0];

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'update',
            entityType: 'page',
            entityId: page.id,
            entityTitle: page.title
        });

        res.json(page);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete page (Admin only)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Get page title before deleting
        const pageResult = await pool.query('SELECT title FROM pages WHERE id = $1', [id]);
        const pageTitle = pageResult.rows[0]?.title || 'Unknown';

        await pool.query('DELETE FROM pages WHERE id = $1', [id]);

        // Log activity
        await logActivity({
            userId: req.user.id,
            username: req.user.username,
            action: 'delete',
            entityType: 'page',
            entityId: parseInt(id),
            entityTitle: pageTitle
        });

        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
