import pool from './index.js';

const migrateBlocks = async () => {
    console.log('🚀 Running block content migration...');

    try {
        // Add content_blocks column to pages
        await pool.query(`
            ALTER TABLE pages 
            ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'
        `);
        console.log('✅ added content_blocks to pages');

        // Add content_blocks column to guides
        await pool.query(`
            ALTER TABLE guides 
            ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'
        `);
        console.log('✅ added content_blocks to guides');

        // Add content_blocks column to news
        await pool.query(`
            ALTER TABLE news 
            ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'
        `);
        console.log('✅ added content_blocks to news');

        console.log('🎉 Block migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
    }
};

migrateBlocks();
