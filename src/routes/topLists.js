import express from 'express';
import pool from '../db/index.js';

const router = express.Router();

// GET all top lists with platforms data
router.get('/', async (req, res) => {
    try {
        const { status = 'published' } = req.query;

        const result = await pool.query(
            'SELECT * FROM top_lists WHERE status = $1 ORDER BY created_at DESC',
            [status]
        );

        // Fetch platforms for each list
        const listsWithPlatforms = await Promise.all(
            result.rows.map(async (list) => {
                if (list.platform_ids && list.platform_ids.length > 0) {
                    const platformsResult = await pool.query(
                        'SELECT * FROM platforms WHERE id = ANY($1) ORDER BY rating DESC',
                        [list.platform_ids]
                    );
                    return { ...list, platforms: platformsResult.rows };
                }
                return { ...list, platforms: [] };
            })
        );

        res.json(listsWithPlatforms);
    } catch (error) {
        console.error('Error fetching top lists:', error);
        res.status(500).json({ error: 'Failed to fetch top lists' });
    }
});

// GET single top list
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const isNumeric = /^\d+$/.test(identifier);

        const query = isNumeric
            ? 'SELECT * FROM top_lists WHERE id = $1'
            : 'SELECT * FROM top_lists WHERE slug = $1';

        const result = await pool.query(query, [identifier]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Top list not found' });
        }

        const list = result.rows[0];

        // Fetch platforms
        if (list.platform_ids && list.platform_ids.length > 0) {
            const platformsResult = await pool.query(
                'SELECT * FROM platforms WHERE id = ANY($1) ORDER BY rating DESC',
                [list.platform_ids]
            );
            list.platforms = platformsResult.rows;
        } else {
            list.platforms = [];
        }

        res.json(list);
    } catch (error) {
        console.error('Error fetching top list:', error);
        res.status(500).json({ error: 'Failed to fetch top list' });
    }
});

// POST create top list
router.post('/', async (req, res) => {
    try {
        const { title, slug, description, platform_ids = [], status = 'published' } = req.body;

        const result = await pool.query(
            `INSERT INTO top_lists (title, slug, description, platform_ids, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [title, slug, description, platform_ids, status]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating top list:', error);
        res.status(500).json({ error: 'Failed to create top list' });
    }
});

// PUT update top list
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, description, platform_ids, status } = req.body;

        const result = await pool.query(
            `UPDATE top_lists SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        platform_ids = COALESCE($4, platform_ids),
        status = COALESCE($5, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *`,
            [title, slug, description, platform_ids, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Top list not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating top list:', error);
        res.status(500).json({ error: 'Failed to update top list' });
    }
});

// DELETE top list
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM top_lists WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Top list not found' });
        }

        res.json({ message: 'Top list deleted successfully' });
    } catch (error) {
        console.error('Error deleting top list:', error);
        res.status(500).json({ error: 'Failed to delete top list' });
    }
});

export default router;
