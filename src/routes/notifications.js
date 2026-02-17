import express from 'express';
import pool from '../db/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// ===========================================
// ACTIVITY LOG ROUTES
// ===========================================

// GET all activity logs (superadmin only can see all, others see their own)
router.get('/activity', authenticate, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const user = req.user;

        let query;
        let params;

        if (user.role === 'superadmin') {
            // Superadmin sees everything
            query = `
                SELECT * FROM activity_log 
                ORDER BY created_at DESC 
                LIMIT $1 OFFSET $2
            `;
            params = [limit, offset];
        } else {
            // Others see only their own activities
            query = `
                SELECT * FROM activity_log 
                WHERE user_id = $3
                ORDER BY created_at DESC 
                LIMIT $1 OFFSET $2
            `;
            params = [limit, offset, user.id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activity log:', error);
        res.status(500).json({ error: 'Failed to fetch activity log' });
    }
});

// ===========================================
// NOTIFICATIONS ROUTES
// ===========================================

// GET notifications for current user
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { unread_only = false, limit = 20 } = req.query;

        let query = `
            SELECT * FROM notifications 
            WHERE user_id = $1
        `;
        const params = [userId];

        if (unread_only === 'true') {
            query += ' AND is_read = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT $2';
        params.push(limit);

        const result = await pool.query(query, params);

        // Also get unread count
        const countResult = await pool.query(
            'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );

        res.json({
            notifications: result.rows,
            unread_count: parseInt(countResult.rows[0].unread_count)
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

// Delete a notification
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

export default router;

// ===========================================
// HELPER FUNCTIONS (exported for use in other routes)
// ===========================================

/**
 * Log an activity and notify superadmins
 * @param {Object} options
 * @param {number} options.userId - ID of user performing action
 * @param {string} options.username - Username of user
 * @param {string} options.action - Action type (create, update, delete, publish)
 * @param {string} options.entityType - Type of entity (guide, news, page, platform)
 * @param {number} options.entityId - ID of entity
 * @param {string} options.entityTitle - Title of entity
 * @param {Object} options.details - Additional details
 */
export async function logActivity({ userId, username, action, entityType, entityId, entityTitle, details = {} }) {
    try {
        // Log the activity
        await pool.query(
            `INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_title, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, username, action, entityType, entityId, entityTitle, JSON.stringify(details)]
        );

        // Create notification for superadmins
        const superadmins = await pool.query(
            "SELECT id FROM users WHERE role = 'superadmin'"
        );

        const actionLabels = {
            create: 'created',
            update: 'updated',
            delete: 'deleted',
            publish: 'published'
        };

        const title = `${username} ${actionLabels[action] || action} a ${entityType}`;
        const message = `"${entityTitle}" was ${actionLabels[action] || action}.`;
        const link = `/${entityType}s/${entityId}`;

        for (const admin of superadmins.rows) {
            // Don't notify the user who performed the action
            if (admin.id !== userId) {
                await pool.query(
                    `INSERT INTO notifications (user_id, type, title, message, link)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [admin.id, action, title, message, link]
                );
            }
        }

    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw - logging shouldn't break the main operation
    }
}
