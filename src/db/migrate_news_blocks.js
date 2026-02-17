import pool from './index.js';

async function migrateNewsBlocks() {
    try {
        console.log('📰 Starting news content_blocks migration...');

        // Check if column exists
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'news' AND column_name = 'content_blocks'
        `);

        if (checkColumn.rows.length === 0) {
            await pool.query(`
                ALTER TABLE news 
                ADD COLUMN content_blocks JSONB DEFAULT '[]'
            `);
            console.log('✅ content_blocks column added to news table');
        } else {
            console.log('ℹ️ content_blocks column already exists in news table');
        }

        console.log('🎉 News migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateNewsBlocks();
