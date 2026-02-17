import express from 'express';
import pool from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Available Google Fonts
const AVAILABLE_FONTS = [
    { name: 'Inter', value: 'Inter', category: 'sans-serif' },
    { name: 'Roboto', value: 'Roboto', category: 'sans-serif' },
    { name: 'Open Sans', value: 'Open Sans', category: 'sans-serif' },
    { name: 'Poppins', value: 'Poppins', category: 'sans-serif' },
    { name: 'Montserrat', value: 'Montserrat', category: 'sans-serif' },
    { name: 'Lato', value: 'Lato', category: 'sans-serif' },
    { name: 'Nunito', value: 'Nunito', category: 'sans-serif' },
    { name: 'Raleway', value: 'Raleway', category: 'sans-serif' },
    { name: 'Ubuntu', value: 'Ubuntu', category: 'sans-serif' },
    { name: 'Outfit', value: 'Outfit', category: 'sans-serif' },
    { name: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans', category: 'sans-serif' },
    { name: 'DM Sans', value: 'DM Sans', category: 'sans-serif' },
    { name: 'Space Grotesk', value: 'Space Grotesk', category: 'sans-serif' },
    { name: 'Manrope', value: 'Manrope', category: 'sans-serif' },
    { name: 'Work Sans', value: 'Work Sans', category: 'sans-serif' },
    { name: 'Playfair Display', value: 'Playfair Display', category: 'serif' },
    { name: 'Merriweather', value: 'Merriweather', category: 'serif' },
    { name: 'Lora', value: 'Lora', category: 'serif' },
    { name: 'Source Serif Pro', value: 'Source Serif Pro', category: 'serif' },
    { name: 'Noto Serif', value: 'Noto Serif', category: 'serif' },
    { name: 'Fira Code', value: 'Fira Code', category: 'monospace' },
    { name: 'JetBrains Mono', value: 'JetBrains Mono', category: 'monospace' },
    { name: 'Cairo', value: 'Cairo', category: 'sans-serif', rtl: true },
    { name: 'Tajawal', value: 'Tajawal', category: 'sans-serif', rtl: true },
    { name: 'Almarai', value: 'Almarai', category: 'sans-serif', rtl: true },
];

// GET /settings/fonts - Get available fonts (public)
router.get('/fonts', (req, res) => {
    res.json(AVAILABLE_FONTS);
});

// GET /settings - Get all public settings (public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT setting_key, setting_value, setting_type FROM site_settings'
        );

        // Convert to object
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// GET /settings/all - Get all settings with details (admin only)
router.get('/all', authenticate, authorize('superadmin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, u.username as updated_by_name
            FROM site_settings s
            LEFT JOIN users u ON s.updated_by = u.id
            ORDER BY s.id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT /settings/:key - Update a setting (superadmin only)
router.put('/:key', authenticate, authorize('superadmin'), async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const result = await pool.query(`
            UPDATE site_settings 
            SET setting_value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = $3
            RETURNING *
        `, [value, req.user.id, key]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});

// POST /settings - Create a new setting (superadmin only)
router.post('/', authenticate, authorize('superadmin'), async (req, res) => {
    try {
        const { key, value, type = 'string', description } = req.body;

        const result = await pool.query(`
            INSERT INTO site_settings (setting_key, setting_value, setting_type, description, updated_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [key, value, type, description, req.user.id]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Setting already exists' });
        }
        console.error('Error creating setting:', error);
        res.status(500).json({ error: 'Failed to create setting' });
    }
});

export default router;
