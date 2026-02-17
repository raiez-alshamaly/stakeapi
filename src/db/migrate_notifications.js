import pool from './index.js';

async function migrateNotifications() {
    try {
        console.log('📢 Starting notifications migration...');

        // Activity Log Table - سجل الأحداث
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                username VARCHAR(255),
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER,
                entity_title VARCHAR(500),
                details JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ activity_log table created');

        // Notifications Table - الإشعارات
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                link VARCHAR(500),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ notifications table created');

        // Add index for faster queries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
        `);
        console.log('✅ Indexes created');

        console.log('🎉 Notifications migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateNotifications();
